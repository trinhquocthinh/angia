import { prepareExtraction } from './prepareExtraction.js';
import { dispatchExtraction } from './dispatchExtraction.js';
import { canUseApprovedImage } from '../domain/canUseApprovedImage.js';
import { ImageConversionError } from './ImageConversionError.js';
import { assessExtraction } from '../domain/assessExtraction.js';
import type { DocumentToExtract } from '../domain/ExtractionDocument.js';
import type { BudgetCall, ExtractionDependencies, ExtractorImage, ExtractorResult } from './ports.js';
import { OcrGuardChangedError } from './OcrGuardChangedError.js';
import { OcrGateBlockedError, type OcrGateReason } from './OcrGateBlockedError.js';
import { toBudgetCall } from './toBudgetCall.js';

interface ExtractionJob {
  documentId: string;
  familyId: string;
  /** pg-boss đã hết lượt thử lại: lỗi gọi AI lần này chuyển chứng từ sang nhập tay thay vì ném lỗi. */
  finalAttempt: boolean;
}
type ManualReason =
  | 'empty'
  | 'type_mismatch'
  | 'invalid_json'
  | 'schema_mismatch'
  | 'extractor_failed'
  | 'image_unusable'
  | 'privacy_required'
  | 'consent_required';
export type ExtractionOutcome =
  | { status: 'skipped' }
  | { status: 'awaiting_budget'; reason: OcrGateReason }
  | { status: 'pending_review'; costUsd: number }
  | { status: 'manual_entry'; reason: ManualReason; costUsd: number };

// SPEC-009/BR-041/BR-018: chỉ extracting đã duyệt riêng tư và giữ được ngân sách mới gọi AI →
// pending_review | manual_entry; hết ngân sách → awaiting_budget. Không giữ transaction trong lúc gọi AI;
// extractor đã gồm model dự phòng (E3-S6-T2) nên mỗi lượt thử chỉ giữ một chỗ ngân sách.
export async function extractDocument(
  deps: ExtractionDependencies,
  job: ExtractionJob,
): Promise<ExtractionOutcome> {
  const call = toBudgetCall(deps.budget);
  const document = await prepareExtraction(deps, job, call);
  if (!document) return { status: 'skipped' };
  if (document === 'consent_required')
    return { status: 'manual_entry', reason: 'consent_required', costUsd: 0 };
  if (document === 'privacy_required')
    return { status: 'manual_entry', reason: 'privacy_required', costUsd: 0 };
  if ('blocked' in document) {
    if (document.blocked === 'dispatch_limit')
      return { status: 'manual_entry', reason: 'extractor_failed', costUsd: 0 };
    return { status: 'awaiting_budget', reason: document.blocked };
  }
  let result: ExtractorResult;
  try {
    result = await deps.extractor.extract(await loadImage(deps, document), () =>
      dispatchExtraction(deps, job, call, document),
    );
    return await finish(deps, job, call, document, result);
  } catch (error) {
    if (error instanceof OcrGuardChangedError) return guardChanged(deps, job, call, error.reason);
    if (error instanceof OcrGateBlockedError) return gateBlocked(deps, job, call, error.reason);
    if (error instanceof ImageConversionError) return toManualEntry(deps, job, call, 'image_unusable', 0);
    if (!job.finalAttempt) {
      // Lỗi trước dispatch trả held; lỗi sau dispatch giữ used và retry không trừ thêm.
      await deps.repository.withFamily(job.familyId, (store) => store.settleBudget(job.documentId, 0, call));
      throw error;
    }
    return toManualEntry(deps, job, call, 'extractor_failed', 0);
  }
}

async function finish(
  deps: ExtractionDependencies,
  job: ExtractionJob,
  call: BudgetCall,
  document: DocumentToExtract,
  result: ExtractorResult,
): Promise<ExtractionOutcome> {
  if (!result.ok) return toManualEntry(deps, job, call, result.reason, result.costUsd);
  const verdict = assessExtraction(document.declaredType, result.content);
  if (!verdict.usable) return toManualEntry(deps, job, call, verdict.reason, result.costUsd);
  const { provider, model, costUsd, content } = result;
  await deps.repository.withFamily(job.familyId, async (store) => {
    await store.savePendingReview(document.id, {
      type: content.type,
      provider,
      model,
      payload: content,
      costUsd,
    });
    await store.settleBudget(document.id, costUsd, call);
  });
  return { status: 'pending_review', costUsd };
}

// Chuyển trạng thái và trả held cùng transaction; phí thực thuộc sổ provider độc lập.
async function toManualEntry(
  deps: ExtractionDependencies,
  job: ExtractionJob,
  call: BudgetCall,
  reason: ManualReason,
  costUsd: number,
): Promise<ExtractionOutcome> {
  await deps.repository.withFamily(job.familyId, async (store) => {
    await store.markManualEntry(job.documentId);
    await store.settleBudget(job.documentId, costUsd, call);
  });
  return { status: 'manual_entry', reason, costUsd };
}

// Đọc một ảnh đã đồng ý, kiểm byte/hash trên mỗi lần thử.
async function loadImage(deps: ExtractionDependencies, document: DocumentToExtract): Promise<ExtractorImage> {
  if (!document.imageKey) throw new ImageConversionError();
  const image = await deps.ocrImages.get(document.imageKey);
  if (!canUseApprovedImage(document, image.sha256)) throw new ImageConversionError();
  return { bytes: image.bytes, mimeType: image.mimeType };
}

async function gateBlocked(
  deps: ExtractionDependencies,
  job: ExtractionJob,
  call: BudgetCall,
  reason: OcrGateReason,
): Promise<ExtractionOutcome> {
  if (reason === 'dispatch_limit') return toManualEntry(deps, job, call, 'extractor_failed', 0);
  await deps.repository.withFamily(job.familyId, async (store) => {
    await store.markAwaitingBudget(job.documentId, reason);
    await store.settleBudget(job.documentId, 0, call);
  });
  return { status: 'awaiting_budget', reason };
}

async function guardChanged(
  deps: ExtractionDependencies,
  job: ExtractionJob,
  call: BudgetCall,
  reason: OcrGuardChangedError['reason'],
): Promise<ExtractionOutcome> {
  if (reason !== 'skipped') return toManualEntry(deps, job, call, reason, 0);
  await deps.repository.withFamily(job.familyId, (store) => store.settleBudget(job.documentId, 0, call));
  return { status: 'skipped' };
}
