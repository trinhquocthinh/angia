import type { SanitizeDependencies, SanitizeJob, SanitizeOutcome } from './ports.js';

// COMMIT có thể đã thành công; chỉ dọn khóa mới sau khi xác nhận nó không được tham chiếu.
export async function reconcileSanitizedImage(
  deps: SanitizeDependencies,
  job: SanitizeJob,
  key: string,
): Promise<SanitizeOutcome | null> {
  const current = await deps.repository.withFamily(job.familyId, (store) =>
    store.findDocument(job.documentId),
  );
  if (current?.imageKey === key) {
    return {
      status:
        current.status === 'extracting' || current.status === 'manual_entry' ? current.status : 'skipped',
    };
  }
  await deps.repository.withFamily(job.familyId, (store) => store.recordPurge(key));
  await deps.storage.delete(key).catch(() => undefined);
  return null;
}
