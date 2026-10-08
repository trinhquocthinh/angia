import { canUseApprovedOcrImage } from '../domain/canUseApprovedOcrImage.js';
import { ImageConversionError } from './ImageConversionError.js';
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
  | { status: 'pending_review'; costUsd: number }
  | { status: 'manual_entry'; reason: ManualReason; costUsd: number };

// SPEC-009/BR-041: chỉ extracting đã duyệt riêng tư → pending_review | manual_entry. Không giữ transaction
// trong lúc gọi AI; kiểm ngân sách (awaiting_budget) và model dự phòng bổ sung ở E3-S6.
export async function extractDocument(
  deps: ExtractionDependencies,
  job: ExtractionJob,
): Promise<ExtractionOutcome> {
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
    await store.markExtracting(found.id);
    return found;
  });
  if (!document) return { status: 'skipped' };
  if (document === 'privacy_required')
    return { status: 'manual_entry', reason: 'privacy_required', costUsd: 0 };
  let result: ExtractorResult;
  try {
    result = await deps.extractor.extract(await loadImage(deps, document));
  } catch (error) {
    if (error instanceof ImageConversionError) return toManualEntry(deps, job, 'image_unusable', 0);
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
    store.savePendingReview(document.id, {
      type: content.type,
      provider,
      model,
      payload: content,
      costUsd,
    }),
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

// Đọc đúng bản OCR đã duyệt, kiểm byte/hash trên mỗi lần thử; không lấy ảnh gốc hoặc preview làm fallback.
async function loadImage(deps: ExtractionDependencies, document: DocumentToExtract): Promise<ExtractorImage> {
  if (!document.ocrImageKey) throw new ImageConversionError();
  const image = await deps.ocrImages.get(document.ocrImageKey);
  if (!canUseApprovedOcrImage(document, document.originalKey, image.sha256)) throw new ImageConversionError();
  return { bytes: image.bytes, mimeType: image.mimeType };
}
