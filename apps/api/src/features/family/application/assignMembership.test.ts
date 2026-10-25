import { describe, expect, it } from 'vitest';
import type { MemberAccount } from '../domain/Membership.js';
import { createFakeFamilyAdminRepository } from '@src/shared/test/createFakeFamilyAdminRepository.js';
import { assignMembership } from './assignMembership.js';

const family = (id: string) => ({ id, name: id, createdAt: new Date(0) });
const account = (id: string, fields: Partial<MemberAccount> = {}): MemberAccount => ({
  id,
  displayName: id,
  isSystemAdmin: false,
  familyId: null,
  role: null,
  ...fields,
});

describe('assignMembership', () => {
  it('gán tài khoản chờ vào nhóm trống với vai trò main', async () => {
    const { repository, state } = createFakeFamilyAdminRepository({
      families: [family('f1')],
      accounts: [account('a')],
    });
    const outcome = await assignMembership(repository, { accountId: 'a', familyId: 'f1', role: 'main' });
    expect(outcome).toEqual({ ok: true, account: account('a', { familyId: 'f1', role: 'main' }) });
    expect(state.accounts[0]).toMatchObject({ familyId: 'f1', role: 'main' });
  });

  it('từ chối và không ghi khi quy tắc miền không cho phép', async () => {
    const { repository, state } = createFakeFamilyAdminRepository({
      families: [family('f1'), family('f2')],
      accounts: [account('a', { familyId: 'f1', role: 'main' }), account('b')],
    });
    expect(await assignMembership(repository, { accountId: 'a', familyId: 'f2', role: 'main' })).toEqual({
      ok: false,
      code: 'ERR_ACCOUNT_ALREADY_IN_FAMILY',
    });
    expect(await assignMembership(repository, { accountId: 'b', familyId: 'f2', role: 'member' })).toEqual({
      ok: false,
      code: 'ERR_FIRST_ACCOUNT_MUST_BE_MAIN',
    });
    expect(state.accounts.map((item) => item.familyId)).toEqual(['f1', null]);
  });

  it('tài khoản hoặc nhóm không tồn tại trả ERR_NOT_FOUND', async () => {
    const { repository } = createFakeFamilyAdminRepository({
      families: [family('f1')],
      accounts: [account('a')],
    });
    for (const input of [
      { accountId: 'x', familyId: 'f1' },
      { accountId: 'a', familyId: 'x' },
    ]) {
      expect(await assignMembership(repository, { ...input, role: 'main' })).toEqual({
        ok: false,
        code: 'ERR_NOT_FOUND',
      });
    }
  });
});
