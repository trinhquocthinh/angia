import type { ObjectPurgeDependencies, ObjectPurgeStore } from './ports.js';

const SAFE_ERRORS = new Set([
  'AccessDenied',
  'NoSuchBucket',
  'ServiceUnavailable',
  'SlowDown',
  'TimeoutError',
  'NetworkingError',
  'AbortError',
]);

export async function purgePendingObjects(
  deps: ObjectPurgeDependencies & { signal: AbortSignal },
  options: { batchSize: number; maxAttempts: number },
): Promise<{ deleted: number; failed: number }> {
  const result = { deleted: 0, failed: 0 };
  if (deps.signal.aborted) return result;
  for (const familyId of await deps.repository.listFamilies()) {
    let afterKey: string | undefined;
    while (!deps.signal.aborted) {
      const batch = await deps.repository.withFamily(familyId, async (store) => {
        const keys = await store.next(options.batchSize, options.maxAttempts, afterKey);
        for (const key of keys) {
          if (deps.signal.aborted) break;
          if (await purgeObject(deps.storage, store, key)) result.deleted += 1;
          else result.failed += 1;
        }
        return keys;
      });
      if (batch.length < options.batchSize) break;
      // Con trỏ đi qua cả khóa lỗi: mỗi receipt chỉ thử một lần trong mỗi lượt job.
      afterKey = batch.at(-1);
    }
    if (deps.signal.aborted) break;
  }
  return result;
}

async function purgeObject(
  storage: ObjectPurgeDependencies['storage'],
  store: ObjectPurgeStore,
  key: string,
): Promise<boolean> {
  try {
    await storage.delete(key);
  } catch (error) {
    const name = error instanceof Error ? error.name : undefined;
    await store.recordFailure(key, name && SAFE_ERRORS.has(name) ? name : 'unknown');
    return false;
  }
  await store.remove(key);
  return true;
}
