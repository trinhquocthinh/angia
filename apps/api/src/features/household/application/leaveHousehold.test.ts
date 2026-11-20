import { describe, expect, it } from 'vitest';
import { leaveHousehold } from './leaveHousehold.js';
import type { HouseholdLeaveDependencies } from './leavePorts.js';

const actor = { accountId: 'account', familyId: 'family', role: 'member' as const };
const deps = (
  events: string[],
  result: Awaited<ReturnType<HouseholdLeaveDependencies['repository']['leave']>>,
): HouseholdLeaveDependencies => ({
  repository: {
    leave: async () => {
      events.push('commit');
      return result;
    },
  },
  storage: {
    deletePrefix: async (prefix) => {
      events.push(prefix);
      return 1;
    },
  },
  logger: {
    warn: () => {
      events.push('warn');
    },
  },
});

describe('SPEC-067: điều phối tự rời nhà', () => {
  it('TC-790: tài khoản chưa có nhà không gọi repository', async () => {
    const events: string[] = [];
    expect(await leaveHousehold(deps(events, { ok: true }), { ...actor, familyId: null }, {})).toEqual({
      ok: false,
      code: 'ERR_FORBIDDEN',
    });
    expect(events).toEqual([]);
  });
  it('TC-791: chỉ xoá ảnh sau commit thành công', async () => {
    const events: string[] = [];
    expect(
      await leaveHousehold(deps(events, { ok: true, deletedProfileId: 'profile' }), actor, {
        ownProfileDisposition: 'delete',
      }),
    ).toEqual({ ok: true });
    expect(events).toEqual(['commit', 'families/family/profiles/profile/']);
  });
  it('TC-795: giữ lỗi và details, không xoá object khi từ chối', async () => {
    const events: string[] = [];
    const failure = { ok: false, code: 'ERR_LAST_GUARDIAN', details: { profileIds: ['child'] } } as const;
    expect(await leaveHousehold(deps(events, failure), actor, {})).toEqual(failure);
    expect(events).toEqual(['commit']);
  });
  it('TC-791: storage lỗi sau commit chỉ cảnh báo và trả thành công', async () => {
    const events: string[] = [];
    const dependencies = deps(events, { ok: true, deletedProfileId: 'profile' });
    dependencies.storage.deletePrefix = async () => {
      throw new Error('S3');
    };
    expect(await leaveHousehold(dependencies, actor, { ownProfileDisposition: 'delete' })).toEqual({
      ok: true,
    });
    expect(events).toEqual(['commit', 'warn']);
  });
});
