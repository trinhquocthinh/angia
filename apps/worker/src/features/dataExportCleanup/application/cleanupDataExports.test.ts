import { expect, it, vi } from 'vitest';
import { cleanupDataExports } from './cleanupDataExports.js';
import type { CleanupDataExportsDependencies } from './ports.js';

const expiredId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const liveId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const orphanId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
function fixture() {
  const objects = new Set([
    `exports/${expiredId}.zip`,
    `exports/${liveId}.zip`,
    `exports/${orphanId}.zip`,
    'exports/khong-hop-le.zip',
  ]);
  const removed: string[] = [];
  const deps: CleanupDataExportsDependencies = {
    repository: {
      async *expired() {
        yield { id: expiredId, objectKey: `exports/${expiredId}.zip` };
      },
      removeExpired: vi.fn(async () => {
        removed.push(expiredId);
        return true;
      }),
      expireStale: vi.fn(async () => ({ pendingFailed: 2, failedRemoved: 3 })),
      isActive: vi.fn(async (id) => id === liveId),
    },
    storage: {
      async *list() {
        yield* objects;
      },
      delete: vi.fn(async (key) => {
        objects.delete(key);
      }),
    },
  };
  return { deps, objects, removed };
}
it('TC-825: xoá tệp hết hạn trước dòng, dọn dòng cũ và chỉ xoá ZIP mồ côi đúng mẫu', async () => {
  const { deps, objects, removed } = fixture();
  const result = await cleanupDataExports(deps);
  expect(removed).toEqual([expiredId]);
  expect(objects).toEqual(new Set([`exports/${liveId}.zip`, 'exports/khong-hop-le.zip']));
  expect(result).toEqual({
    expiredRemoved: 1,
    pendingFailed: 2,
    failedRemoved: 3,
    orphanRemoved: 1,
    failed: 0,
  });
  expect(deps.storage.delete).toHaveBeenCalledTimes(2);
  expect(deps.repository.isActive).toHaveBeenCalledWith(liveId);
});
it('TC-825: lỗi một object giữ dòng và không cản tệp khác, không trả định danh trong báo cáo', async () => {
  const { deps, objects, removed } = fixture();
  deps.storage.delete = vi.fn(async (key) => {
    if (key === `exports/${expiredId}.zip`) throw new Error('bi-mat');
    objects.delete(key);
  });
  const result = await cleanupDataExports(deps);
  expect(removed).toEqual([]);
  expect(objects.has(`exports/${orphanId}.zip`)).toBe(false);
  expect(result.failed).toBeGreaterThan(0);
  expect(JSON.stringify(result)).not.toContain(expiredId);
  expect(JSON.stringify(result)).not.toContain('bi-mat');
});
it('TC-825: không xoá dòng khi xoá object thất bại', async () => {
  const { deps } = fixture();
  deps.storage.delete = vi.fn(async () => {
    throw new Error('S3');
  });
  await cleanupDataExports(deps);
  expect(deps.repository.removeExpired).not.toHaveBeenCalled();
});
