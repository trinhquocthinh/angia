import { createHash } from 'node:crypto';
import { ImageConversionError } from '../../extraction/application/ImageConversionError.js';
import type { PrivacyDependencies, PrivacyJob } from './ports.js';
import { validatePrivacyEdits } from '../domain/validatePrivacyEdits.js';
export type PrivacyOutcome =
  { status: 'ready' | 'skipped' } | { status: 'failed'; reason: 'image_unusable' | 'prepare_failed' };

export async function prepareOcrImage(deps: PrivacyDependencies, job: PrivacyJob): Promise<PrivacyOutcome> {
  validatePrivacyEdits(job.edits);
  const document = await deps.repository.withFamily(job.familyId, (store) =>
    store.findDocument(job.documentId),
  );
  if (
    !document ||
    document.status !== 'awaiting_privacy' ||
    document.privacyDraftId !== job.draftId ||
    document.privacyDraftStatus !== 'pending'
  )
    return { status: 'skipped' };
  let key: string | null = null;
  try {
    const bytes = await deps.images.toPng(
      await deps.storage.get(document.originalKey),
      document.mimeType,
      job.edits,
    );
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    key = `families/${job.familyId}/profiles/${document.healthProfileId}/documents/${document.id}/ocr/${job.draftId}/${deps.newId()}.png`;
    await deps.storage.put(key, bytes);
    const saved = await deps.repository.withFamily(job.familyId, (store) =>
      store.saveReady(document.id, job.draftId, key!, sha256),
    );
    if (saved) return { status: 'ready' };
    await deps.storage.delete(key);
    return { status: 'skipped' };
  } catch (error) {
    const recovered = key ? await reconcilePrivacy(deps, job, key) : null;
    if (recovered) return recovered;
    if (!(error instanceof ImageConversionError) && !job.finalAttempt) throw error;
    const changed = await deps.repository.withFamily(job.familyId, (store) =>
      store.markFailed(job.documentId, job.draftId),
    );
    return changed
      ? {
          status: 'failed',
          reason: error instanceof ImageConversionError ? 'image_unusable' : 'prepare_failed',
        }
      : { status: 'skipped' };
  }
}
// Nếu COMMIT mất phản hồi, đọc lại trước khi dọn. Lỗi đọc lại giữ object để tránh xóa ảnh đang dùng.
async function reconcilePrivacy(
  deps: PrivacyDependencies,
  job: PrivacyJob,
  key: string,
): Promise<PrivacyOutcome | null> {
  const current = await deps.repository.withFamily(job.familyId, (store) =>
    store.findDocument(job.documentId),
  );
  if (current?.ocrImageKey === key)
    return { status: current.privacyDraftStatus === 'ready' ? 'ready' : 'skipped' };
  await deps.storage.delete(key);
  return null;
}
