import { describe, expect, it } from 'vitest';
import type { MembershipActor } from './membershipPorts.js';
import { listHouseholdMembers } from './listHouseholdMembers.js';

describe('E28-S3-T1: đọc danh sách thành viên', () => {
  const actor = { accountId: 'self', familyId: 'family', role: 'main' as const };
  it('từ chối tài khoản chưa có nhà trước khi đọc kho', async () => {
    const repository = {
      list: async () => {
        throw new Error('Không được đọc kho');
      },
    };
    expect(await listHouseholdMembers(repository, { ...actor, familyId: null })).toEqual({
      ok: false,
      code: 'ERR_FORBIDDEN',
    });
  });
  it.each(['main', 'member'] as const)('cho phép vai trò %s đọc đúng nhà và giữ thứ tự', async (role) => {
    const repository = {
      list: async (input: MembershipActor & { familyId: string }) => ({
        ok: true as const,
        value: [
          { accountId: input.accountId, displayName: input.familyId, role, isOwner: true, isSelf: true },
          { accountId: 'other', displayName: 'An', role: 'member' as const, isOwner: false, isSelf: false },
        ],
      }),
    };
    expect(await listHouseholdMembers(repository, { ...actor, role })).toEqual({
      ok: true,
      value: {
        members: [
          { accountId: 'self', displayName: 'family', role, isOwner: true, isSelf: true },
          { accountId: 'other', displayName: 'An', role: 'member', isOwner: false, isSelf: false },
        ],
      },
    });
  });
  it('giữ lỗi khi kho kiểm lại quyền và từ chối truy cập', async () => {
    const repository = { list: async () => ({ ok: false as const, code: 'ERR_FORBIDDEN' as const }) };
    expect(await listHouseholdMembers(repository, actor)).toEqual({ ok: false, code: 'ERR_FORBIDDEN' });
  });
});
