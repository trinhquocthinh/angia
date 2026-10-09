import { canUseApprovedOcrImage } from '../domain/canUseApprovedOcrImage.js';
import { ImageConversionError } from './ImageConversionError.js';
import { assessExtraction } from '../domain/assessExtraction.js';
import { canStartExtraction } from '../domain/canStartExtraction.js';
import type { DocumentToExtract } from '../domain/ExtractionDocument.js';
import type { BudgetCall, ExtractionDependencies, ExtractorImage, ExtractorResult } from './ports.js';
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
  | 'privacy_required';
export type ExtractionOutcome =
  | { status: 'skipped' }
  | { status: 'awaiting_budget' }
  | { status: 'pending_review'; costUsd: number }
  | { status: 'manual_entry'; reason: ManualReason; costUsd: number };

// SPEC-009/BR-041/BR-018: chỉ extracting đã duyệt riêng tư và giữ được ngân sách mới gọi AI →
// pending_review | manual_entry; hết ngân sách → awaiting_budget. Không giữ transaction trong lúc gọi AI;
// model dự phòng bổ sung ở E3-S6-T2.
export async function extractDocument(
  deps: ExtractionDependencies,
  job: ExtractionJob,
): Promise<ExtractionOutcome> {
  const call = toBudgetCall(deps.budget);
  const document = await deps.repository.withFamily(job.familyId, async (store) => {
    const found = await store.findDocument(job.documentId);
    if (!found || (found.status !== 'uploaded' && !canStartExtraction(found.status))) return null;
    if (
      found.status === 'uploaded' ||
      !found.ocrImageKey?.startsWith(`families/${job.familyId}/`) ||
      !found.ocrImageKey.startsWith(found.originalKey.slice(0, found.originalKey.lastIndexOf('/') + 1)) ||
      found.ocrImageKey === found.previewKey ||
      !canUseApprovedOcrImage(found, found.originalKey, found.ocrImageSha256 ?? '')
    ) {
      await store.markManualEntry(found.id);
      return 'privacy_required' as const;
    }
    if (!(await store.reserveBudget(found.id, call))) {
      await store.markAwaitingBudget(found.id);
      return 'awaiting_budget' as const;
    }
    await store.markExtracting(found.id);
    return found;
  });
  if (!document) return { status: 'skipped' };
  if (document === 'privacy_required')
    return { status: 'manual_entry', reason: 'privacy_required', costUsd: 0 };
  if (document === 'awaiting_budget') return { status: 'awaiting_budget' };
  let result: ExtractorResult;
  try {
    result = await deps.extractor.extract(await loadImage(deps, document));
  } catch (error) {
    if (error instanceof ImageConversionError) return toManualEntry(deps, job, call, 'image_unusable', 0);
    if (!job.finalAttempt) {
      // Lỗi mạng/HTTP không có usage.cost: trả lại chỗ giữ, lần thử lại sẽ giữ chỗ mới.
      await deps.repository.withFamily(job.familyId, (store) => store.settleBudget(job.documentId, 0, call));
      throw error;
    }
    return toManualEntry(deps, job, call, 'extractor_failed', 0);
  }
  return finish(deps, job, call, document, result);
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

// Quyết toán cùng transaction với chuyển trạng thái: chi phí thực của lời gọi (nếu có) được ghi đúng một lần.
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

// Đọc đúng bản OCR đã duyệt, kiểm byte/hash trên mỗi lần thử; không lấy ảnh gốc hoặc preview làm fallback.
async function loadImage(deps: ExtractionDependencies, document: DocumentToExtract): Promise<ExtractorImage> {
  if (!document.ocrImageKey) throw new ImageConversionError();
  const image = await deps.ocrImages.get(document.ocrImageKey);
  if (!canUseApprovedOcrImage(document, document.originalKey, image.sha256)) throw new ImageConversionError();
  return { bytes: image.bytes, mimeType: image.mimeType };
}
