import { describe, expect, it } from 'vitest';
import { changeHouseholdMember } from './changeHouseholdMember.js';
import type { HouseholdMembershipRepository } from './membershipPorts.js';

describe('SPEC-066: kiểm quyền trước khi quản lý thành viên', () => {
  const actor = { accountId: 'actor', familyId: 'family', role: 'main' as const };
  const unavailable: HouseholdMembershipRepository = {
    list: async () => {
      throw new Error('Không được đọc danh sách');
    },
    change: () => {
      throw new Error('Không được truy cập kho khi không có quyền');
    },
  };
  it('TC-784: chưa có nhà, member và tự thao tác đều bị chặn', async () => {
    for (const input of [
      { ...actor, familyId: null },
      { ...actor, role: 'member' as const },
    ])
      expect(await changeHouseholdMember(unavailable, input, 'target', { action: 'remove' })).toEqual({
        ok: false,
        code: 'ERR_FORBIDDEN',
      });
    expect(await changeHouseholdMember(unavailable, actor, actor.accountId, { action: 'remove' })).toEqual({
      ok: false,
      code: 'ERR_FORBIDDEN',
    });
  });
  it('TC-782: chuyển thao tác hợp lệ vào transaction và giữ lỗi kiểm lại quyền', async () => {
    const denied: HouseholdMembershipRepository = {
      list: async () => {
        throw new Error('Không được đọc danh sách');
      },
      change: async () => ({ ok: false, code: 'ERR_OWNER_PROTECTED' }),
    };
    expect(
      await changeHouseholdMember(denied, actor, 'target', { action: 'change_role', role: 'member' }),
    ).toEqual({ ok: false, code: 'ERR_OWNER_PROTECTED' });
  });
});
