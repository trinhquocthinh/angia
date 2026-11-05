import { describe, expect, it } from 'vitest';
import { purgePendingObjects } from './purgePendingObjects.js';
import type { ObjectPurgeStore } from './ports.js';

function fixture(keys: string[], failures: string[] = []) {
  const rows = new Map(keys.map((key) => [key, { attempts: 0, error: null as string | null }]));
  const calls: string[] = [];
  const controller = new AbortController();
  const repository = {
    listFamilies: async () => ['a', 'b'],
    withFamily: async <T>(familyId: string, work: (store: ObjectPurgeStore) => Promise<T>) => {
      const store = {
        next: async (limit: number, maxAttempts: number, afterKey?: string): Promise<string[]> =>
          [...rows.keys()]
            .filter(
              (key) =>
                key.startsWith(`families/${familyId}/`) &&
                rows.get(key)!.attempts < maxAttempts &&
                (!afterKey || key > afterKey),
            )
            .sort()
            .slice(0, limit),
        remove: async (key: string) => {
          rows.delete(key);
        },
        recordFailure: async (key: string, error: string) => {
          const row = rows.get(key)!;
          row.attempts += 1;
          row.error = error;
        },
      };
      return work(store);
    },
  };
  const storage = {
    delete: async (key: string) => {
      calls.push(key);
      if (failures.includes(key)) throw Object.assign(new Error(`PII ${key}`), { name: 'AccessDenied' });
    },
  };
  return { deps: { repository, storage, signal: controller.signal }, rows, calls, controller };
}

describe('Dọn receipt object bền vững (SPEC-038)', () => {
  it('TC-421: vét nhiều lô và gia đình, giữ khóa lỗi để thử lại ở lượt sau', async () => {
    const f = fixture(['families/a/1', 'families/a/2', 'families/a/3', 'families/b/1'], ['families/a/1']);
    expect(await purgePendingObjects(f.deps, { batchSize: 2, maxAttempts: 10 })).toEqual({
      deleted: 3,
      failed: 1,
    });
    expect(f.calls).toEqual(['families/a/1', 'families/a/2', 'families/a/3', 'families/b/1']);
    expect([...f.rows]).toEqual([['families/a/1', { attempts: 1, error: 'AccessDenied' }]]);
    expect(await purgePendingObjects(f.deps, { batchSize: 2, maxAttempts: 10 })).toEqual({
      deleted: 0,
      failed: 1,
    });
    expect(f.rows.get('families/a/1')?.attempts).toBe(2);
  });

  it('TC-421: hủy giữa lô thì giữ receipt chưa xử lý và không sang gia đình tiếp', async () => {
    const f = fixture(['families/a/1', 'families/a/2', 'families/b/1']);
    f.deps.storage.delete = async (key) => {
      f.calls.push(key);
      f.controller.abort();
    };
    expect(await purgePendingObjects(f.deps, { batchSize: 100, maxAttempts: 10 })).toEqual({
      deleted: 1,
      failed: 0,
    });
    expect(f.calls).toEqual(['families/a/1']);
    expect([...f.rows.keys()]).toEqual(['families/a/2', 'families/b/1']);
  });

  it('TC-422: bỏ qua receipt đã đủ 10 lần, chạy lại sau thành công không xóa lần nữa', async () => {
    const f = fixture(['families/a/1', 'families/a/2']);
    f.rows.get('families/a/1')!.attempts = 10;
    expect(await purgePendingObjects(f.deps, { batchSize: 100, maxAttempts: 10 })).toEqual({
      deleted: 1,
      failed: 0,
    });
    expect(await purgePendingObjects(f.deps, { batchSize: 100, maxAttempts: 10 })).toEqual({
      deleted: 0,
      failed: 0,
    });
    expect(f.calls).toEqual(['families/a/2']);
  });

  it('TC-421: signal đã hủy không đọc repository hoặc gọi S3', async () => {
    const f = fixture(['families/a/1']);
    f.controller.abort();
    f.deps.repository.listFamilies = async () => {
      throw new Error('Không được đọc');
    };
    expect(await purgePendingObjects(f.deps, { batchSize: 100, maxAttempts: 10 })).toEqual({
      deleted: 0,
      failed: 0,
    });
    expect(f.calls).toEqual([]);
  });

  it('TC-421: mã lỗi lạ không được lưu thông điệp hoặc định danh', async () => {
    const f = fixture(['families/a/1']);
    f.deps.storage.delete = async () => {
      throw { name: 'TenNguoiDung', message: 'PII' };
    };
    await purgePendingObjects(f.deps, { batchSize: 100, maxAttempts: 10 });
    expect(f.rows.get('families/a/1')).toEqual({ attempts: 1, error: 'unknown' });
  });
});
