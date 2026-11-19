import { describe, expect, it, vi } from 'vitest';
import { executeFamilyDeletion } from './executeFamilyDeletion.js';
import type { FamilyDeletionStore } from './ports.js';

const request = { id: 'request', requestedBy: 'owner' };

// Kho giả ghi lại thứ tự gọi để kiểm cả thứ tự "DB trong transaction → object sau COMMIT".
function setup(options: {
  due?: boolean;
  accounts?: string[];
  ownerId?: string | null;
  profiles?: string[];
  failFamilies?: string[];
  storageFails?: boolean;
}) {
  const calls: string[] = [];
  const store: FamilyDeletionStore = {
    lockDue: async () => (options.due === false ? null : request),
    readHousehold: async () => ({
      ownerId: options.ownerId === undefined ? 'owner' : options.ownerId,
      accountIds: options.accounts ?? ['owner'],
    }),
    cancel: async (_id, reason) => void calls.push(`cancel:${reason}`),
    deleteFamily: async () => {
      calls.push('deleteFamily');
      return options.profiles ?? ['p1', 'p2'];
    },
    enqueuePurge: async (profileId) => void calls.push(`enqueue:${profileId}`),
    enqueueFamilySweep: async () => void calls.push('enqueue:sweep'),
    audit: async (action) => void calls.push(`audit:${action}`),
  };
  const repository = {
    listDueFamilyIds: async () => ['fam-a', 'fam-b'],
    withFamily: async <T>(familyId: string, work: (s: FamilyDeletionStore) => Promise<T>) => {
      if (options.failFamilies?.includes(familyId)) throw new Error('DB lỗi giả lập');
      calls.push(`begin:${familyId}`);
      const result = await work(store);
      calls.push(`commit:${familyId}`);
      return result;
    },
  };
  const storage = {
    async *list(prefix: string) {
      calls.push(`list:${prefix}`);
      yield { key: `${prefix}x` };
    },
    delete: async (key: string) => {
      calls.push(`delete:${key}`);
      if (options.storageFails) throw new Error('S3 lỗi giả lập');
    },
  };
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return { deps: { repository, storage, logger }, calls, logger };
}

describe('SPEC-069: job execute-family-deletion', () => {
  it('TC-806: nhà chỉ còn Chủ hộ → xoá DB, ghi audit, enqueue vét từng hồ sơ, rồi mới xoá object sau COMMIT', async () => {
    const f = setup({});
    expect(await executeFamilyDeletion(f.deps)).toEqual({ executed: 2, cancelled: 0, failed: 0 });
    expect(f.calls.slice(0, 8)).toEqual([
      'begin:fam-a',
      'deleteFamily',
      'enqueue:p1',
      'enqueue:p2',
      'enqueue:sweep',
      'audit:family_deletion_executed',
      'commit:fam-a',
      'list:families/fam-a/',
    ]);
    expect(f.calls).toContain('delete:families/fam-a/x');
  });
  it('TC-807: có thêm tài khoản trong 24 giờ → không xoá, huỷ yêu cầu kèm lý do, không đụng object', async () => {
    const f = setup({ accounts: ['owner', 'guest'] });
    expect(await executeFamilyDeletion(f.deps)).toEqual({ executed: 0, cancelled: 2, failed: 0 });
    expect(f.calls).toEqual([
      'begin:fam-a',
      'cancel:family_not_empty',
      'audit:family_deletion_revoked',
      'commit:fam-a',
      'begin:fam-b',
      'cancel:family_not_empty',
      'audit:family_deletion_revoked',
      'commit:fam-b',
    ]);
  });
  it('TC-807: Chủ hộ đã đổi so với người yêu cầu → huỷ với lý do owner_changed', async () => {
    for (const setupOptions of [{ ownerId: 'khac' }, { ownerId: null }, { accounts: [] }]) {
      const f = setup(setupOptions);
      expect(await executeFamilyDeletion(f.deps)).toMatchObject({ executed: 0, cancelled: 2 });
      expect(f.calls).toContain('cancel:owner_changed');
    }
  });
  it('TC-869: không có yêu cầu pending đến hạn thì không xoá hay huỷ gì', async () => {
    const f = setup({ due: false });
    expect(await executeFamilyDeletion(f.deps)).toEqual({ executed: 0, cancelled: 0, failed: 0 });
    expect(f.calls.filter((c) => !c.startsWith('begin') && !c.startsWith('commit'))).toEqual([]);
  });
  it('TC-806: object lỗi sau COMMIT không làm hỏng lượt xoá (job vét đã enqueue) và không lộ khoá', async () => {
    const f = setup({ storageFails: true });
    expect(await executeFamilyDeletion(f.deps)).toEqual({ executed: 2, cancelled: 0, failed: 0 });
    expect(f.logger.warn).toHaveBeenCalled();
    expect(JSON.stringify(f.logger.warn.mock.calls)).not.toContain('families/');
  });
  it('TC-806: lỗi một nhà không chặn nhà khác; đếm lỗi và không dọn object nhà lỗi', async () => {
    const f = setup({ failFamilies: ['fam-a'] });
    expect(await executeFamilyDeletion(f.deps)).toEqual({ executed: 1, cancelled: 0, failed: 1 });
    expect(f.calls.some((c) => c.includes('fam-a'))).toBe(false);
    expect(f.logger.error).toHaveBeenCalledWith({ familyId: 'fam-a', reason: 'Error' }, expect.any(String));
  });
});
