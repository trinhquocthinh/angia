import { ImageConversionError } from '../../extraction/application/ImageConversionError.js';
import type { SanitizeDependencies, SanitizeJob, SanitizeOutcome, SanitizedJpeg } from './ports.js';
import { reconcileSanitizedImage } from './reconcileSanitizedImage.js';

export async function sanitizeDocumentImage(
  deps: SanitizeDependencies,
  job: SanitizeJob,
): Promise<SanitizeOutcome> {
  const document = await deps.repository.withFamily(job.familyId, (store) =>
    store.findDocument(job.documentId),
  );
  if (!document || document.status !== 'uploaded' || !document.imageKey) return { status: 'skipped' };
  const prefix = `families/${job.familyId}/profiles/${document.healthProfileId}/documents/${document.id}/`;
  if (!document.imageKey.startsWith(prefix)) throw new Error('invalid_image_key');
  const oldKey = document.imageKey;
  let output: SanitizedJpeg;
  try {
    output = await deps.images.sanitize(await deps.storage.get(oldKey));
  } catch (error) {
    if (!(error instanceof ImageConversionError)) throw error;
    const changed = await deps.repository.withFamily(job.familyId, (store) =>
      store.markUnusable(document.id, oldKey),
    );
    if (!changed) return { status: 'skipped' };
    await deps.storage.delete(oldKey).catch(() => undefined);
    return { status: 'manual_entry', reason: 'image_unusable' };
  }
  const key = `${prefix}images/${deps.newId()}.jpg`;
  let result: SanitizeOutcome;
  try {
    await deps.storage.put(key, output.bytes);
    const status = await deps.repository.withFamily(job.familyId, (store) =>
      store.saveSanitized(document.id, {
        oldKey,
        key,
        sha256: output.sha256,
        sizeBytes: output.bytes.byteLength,
      }),
    );
    result = status ? { status } : ((await reconcileSanitizedImage(deps, job, key)) ?? { status: 'skipped' });
  } catch (error) {
    const recovered = await reconcileSanitizedImage(deps, job, key);
    if (!recovered) throw error;
    result = recovered;
  }
  if (result.status !== 'skipped') await deps.storage.delete(oldKey).catch(() => undefined);
  return result;
}
