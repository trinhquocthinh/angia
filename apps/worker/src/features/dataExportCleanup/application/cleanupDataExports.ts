import type { CleanupDataExportsDependencies, CleanupDataExportsResult } from './ports.js';

const EXPORT_KEY = /^exports\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.zip$/i;

export async function cleanupDataExports(
  deps: CleanupDataExportsDependencies,
): Promise<CleanupDataExportsResult> {
  const result = { expiredRemoved: 0, pendingFailed: 0, failedRemoved: 0, orphanRemoved: 0, failed: 0 };
  for await (const row of deps.repository.expired()) {
    try {
      await deps.storage.delete(row.objectKey);
      if (await deps.repository.removeExpired(row.id)) result.expiredRemoved++;
    } catch {
      result.failed++;
    }
  }
  Object.assign(result, await deps.repository.expireStale());
  for await (const key of deps.storage.list()) {
    const id = EXPORT_KEY.exec(key)?.[1];
    if (!id) continue;
    try {
      if (await deps.repository.isActive(id)) continue;
      await deps.storage.delete(key);
      result.orphanRemoved++;
    } catch {
      result.failed++;
    }
  }
  return result;
}
