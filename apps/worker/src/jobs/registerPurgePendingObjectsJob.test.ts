import type { PgBoss } from 'pg-boss';
import { expect, it, vi } from 'vitest';
import type { ObjectPurgeStore } from '@src/features/objectPurges/application/ports.js';
import { registerPurgePendingObjectsJob } from './registerPurgePendingObjectsJob.js';

async function register(keys: string[] = [], fail = false) {
  const rows = new Set(keys);
  const store: ObjectPurgeStore = {
    next: async (limit, _max, after) => [...rows].filter((key) => !after || key > after).slice(0, limit),
    remove: async (key) => {
      rows.delete(key);
    },
    recordFailure: vi.fn(async () => undefined),
  };
  const listFamilies = vi.fn(async () => ['a']);
  const deps = {
    repository: {
      listFamilies,
      withFamily: async <T>(_family: string, work: (s: ObjectPurgeStore) => Promise<T>) => work(store),
    },
    storage: {
      delete: async () => {
        if (fail) throw new Error('PII families/a/1');
      },
    },
  };
  const boss = { createQueue: vi.fn(), work: vi.fn(), send: vi.fn(async () => 'j1') };
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  await registerPurgePendingObjectsJob(boss as unknown as PgBoss, deps, logger);
  const handle = boss.work.mock.calls[0]?.[2] as (
    jobs: {
      id: string;
      data: unknown;
      signal: AbortSignal;
    }[],
  ) => Promise<void>;
  const run = (data: unknown = {}) => handle([{ id: 'j1', data, signal: new AbortController().signal }]);
  return { boss, logger, rows, store, run, listFamilies };
}

it('TC-421: enqueue khi khởi động có receipt, xóa thành công và log chỉ số đếm', async () => {
  const f = await register(['families/a/1']);
  expect(f.boss.send).toHaveBeenCalledWith('purge-pending-objects', {});
  await f.run();
  expect(f.rows.size).toBe(0);
  expect(JSON.stringify(f.logger.info.mock.calls)).not.toContain('families/');
});

it('TC-421: không enqueue khi rỗng, payload sai không được dọn', async () => {
  expect((await register()).boss.send).not.toHaveBeenCalled();
  const f = await register(['families/a/1']);
  await f.run(null);
  expect(f.rows.size).toBe(1);
  expect(f.logger.error).toHaveBeenCalled();
});

it('TC-421: lỗi S3 vẫn ghi receipt rồi ném lỗi an toàn để pg-boss retry', async () => {
  const f = await register(['families/a/1'], true);
  await expect(f.run()).rejects.toThrow('object_purges_failed');
  expect(f.rows.size).toBe(1);
  expect(f.store.recordFailure).toHaveBeenCalledWith('families/a/1', 'unknown');
  expect(JSON.stringify(f.logger.warn.mock.calls)).not.toContain('PII');
});

it('TC-806: job có familyId vét đúng nhà đó mà không liệt kê families', async () => {
  const f = await register(['families/a/1']);
  f.listFamilies.mockClear();
  await f.run({ familyId: '0198f0c2-6f6c-7a52-8c0c-5f5f5f5f5f5f' });
  expect(f.rows.size).toBe(0);
  expect(f.listFamilies).not.toHaveBeenCalled();
});
