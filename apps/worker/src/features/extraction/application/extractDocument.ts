import { assessExtraction } from '../domain/assessExtraction.js';
import { canStartExtraction } from '../domain/canStartExtraction.js';
import type { DocumentToExtract } from '../domain/ExtractionDocument.js';
import type { ExtractionDependencies, ExtractorImage, ExtractorResult } from './ports.js';

interface ExtractionJob {
  documentId: string;
  familyId: string;
  /** pg-boss đã hết lượt thử lại: lỗi gọi AI lần này chuyển chứng từ sang nhập tay thay vì ném lỗi. */
  finalAttempt: boolean;
}
type ManualReason = 'empty' | 'type_mismatch' | 'invalid_json' | 'schema_mismatch' | 'extractor_failed';
export type ExtractionOutcome =
  | { status: 'skipped' }
  | { status: 'pending_review'; costUsd: number }
  | { status: 'manual_entry'; reason: ManualReason; costUsd: number };

// SPEC-009: uploaded → extracting → pending_review | manual_entry (BR §3.1). Không giữ transaction
// trong lúc gọi AI; kiểm ngân sách (awaiting_budget) và model dự phòng bổ sung ở E3-S6.
export async function extractDocument(
  deps: ExtractionDependencies,
  job: ExtractionJob,
): Promise<ExtractionOutcome> {
  const document = await deps.repository.withFamily(job.familyId, async (store) => {
    const found = await store.findDocument(job.documentId);
    if (!found || !canStartExtraction(found.status)) return null;
    await store.markExtracting(found.id);
    return found;
  });
  if (!document) return { status: 'skipped' };
  let result: ExtractorResult;
  try {
    result = await deps.extractor.extract(await loadImage(deps, document));
  } catch (error) {
    if (!job.finalAttempt) throw error;
    return toManualEntry(deps, job, 'extractor_failed', 0);
  }
  return finish(deps, job, document, result);
}

async function finish(
  deps: ExtractionDependencies,
  job: ExtractionJob,
  document: DocumentToExtract,
  result: ExtractorResult,
): Promise<ExtractionOutcome> {
  if (!result.ok) return toManualEntry(deps, job, result.reason, result.costUsd);
  const verdict = assessExtraction(document.declaredType, result.content);
  if (!verdict.usable) return toManualEntry(deps, job, verdict.reason, result.costUsd);
  const { provider, model, costUsd, content } = result;
  await deps.repository.withFamily(job.familyId, (store) =>
    store.savePendingReview(document.id, { type: content.type, provider, model, payload: content, costUsd }),
  );
  return { status: 'pending_review', costUsd };
}

async function toManualEntry(
  deps: ExtractionDependencies,
  job: ExtractionJob,
  reason: ManualReason,
  costUsd: number,
): Promise<ExtractionOutcome> {
  await deps.repository.withFamily(job.familyId, (store) => store.markManualEntry(job.documentId));
  return { status: 'manual_entry', reason, costUsd };
}

// Vision-LLM qua OpenRouter không nhận HEIC: giải mã sang JPEG trong bộ nhớ, ảnh gốc trên S3 giữ nguyên.
async function loadImage(deps: ExtractionDependencies, document: DocumentToExtract): Promise<ExtractorImage> {
  const bytes = await deps.storage.get(document.originalKey);
  if (document.mimeType !== 'image/heic') return { bytes, mimeType: document.mimeType };
  return { bytes: await deps.images.heicToJpeg(bytes), mimeType: 'image/jpeg' };
}
