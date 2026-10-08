import { ImageConversionError } from '../../extraction/application/ImageConversionError.js';
import type { PreviewDependencies } from './ports.js';

interface PreviewJob {
  documentId: string;
  familyId: string;
  finalAttempt: boolean;
}
export type PreviewOutcome =
  | { status: 'skipped' | 'awaiting_privacy' }
  | { status: 'manual_entry'; reason: 'image_unusable' | 'preview_failed' };

export async function prepareDocumentPreview(
  deps: PreviewDependencies,
  job: PreviewJob,
): Promise<PreviewOutcome> {
  const document = await deps.repository.withFamily(job.familyId, (store) =>
    store.findDocument(job.documentId),
  );
  if (!document || document.status !== 'uploaded') return { status: 'skipped' };
  let key: string | null = null;
  try {
    const bytes = await deps.images.toWebp(await deps.storage.get(document.originalKey), document.mimeType);
    key = `families/${job.familyId}/profiles/${document.healthProfileId}/documents/${document.id}/previews/${deps.newId()}.webp`;
    await deps.storage.put(key, bytes);
    const saved = await deps.repository.withFamily(job.familyId, (store) =>
      store.savePreview(document.id, key!),
    );
    if (saved) return { status: 'awaiting_privacy' };
    await deps.storage.delete(key);
    return { status: 'skipped' };
  } catch (error) {
    const recovered = key ? await reconcilePreview(deps, job, key) : null;
    if (recovered) return recovered;
    if (!(error instanceof ImageConversionError) && !job.finalAttempt) throw error;
    const changed = await deps.repository.withFamily(job.familyId, (store) =>
      store.markManualEntry(job.documentId),
    );
    return changed
      ? {
          status: 'manual_entry',
          reason: error instanceof ImageConversionError ? 'image_unusable' : 'preview_failed',
        }
      : { status: 'skipped' };
  }
}

// Commit có thể đã thành công dù mất phản hồi. Chỉ xóa khóa khi đọc lại xác nhận nó không được tham chiếu.
async function reconcilePreview(
  deps: PreviewDependencies,
  job: PreviewJob,
  key: string,
): Promise<PreviewOutcome | null> {
  const current = await deps.repository.withFamily(job.familyId, (store) =>
    store.findDocument(job.documentId),
  );
  if (current?.previewKey === key)
    return { status: current.status === 'awaiting_privacy' ? 'awaiting_privacy' : 'skipped' };
  await deps.storage.delete(key);
  return null;
}
