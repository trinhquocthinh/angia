import { describe, expect, it } from 'vitest';
import type { MemberAccount } from '../domain/Membership.js';
import { createFakeFamilyAdminRepository } from '@src/shared/test/createFakeFamilyAdminRepository.js';
import { changeMembership } from './changeMembership.js';

const account = (id: string, fields: Partial<MemberAccount> = {}): MemberAccount => ({
  id,
  displayName: id,
  isSystemAdmin: false,
  familyId: 'f1',
  role: 'main',
  ...fields,
});

function setup(accounts: MemberAccount[]) {
  return createFakeFamilyAdminRepository({
    families: [{ id: 'f1', name: 'Nhà', createdAt: new Date(0) }],
    accounts,
  });
}

describe('changeMembership', () => {
  it('hạ một trong hai main thành member', async () => {
    const { repository } = setup([account('a'), account('b')]);
    const outcome = await changeMembership(repository, {
      accountId: 'a',
      change: { action: 'change_role', role: 'member' },
    });
    expect(outcome).toEqual({ ok: true, account: account('a', { role: 'member' }) });
  });

  it('gỡ member đưa tài khoản về trạng thái chờ gán nhóm', async () => {
    const { repository } = setup([account('a'), account('b', { role: 'member' })]);
    const outcome = await changeMembership(repository, { accountId: 'b', change: { action: 'remove' } });
    expect(outcome).toEqual({ ok: true, account: account('b', { familyId: null, role: null }) });
  });

  it('main cuối cùng: từ chối ERR_LAST_MAIN và giữ nguyên vai trò', async () => {
    const { repository, state } = setup([account('a'), account('b', { role: 'member' })]);
    for (const change of [{ action: 'remove' }, { action: 'change_role', role: 'member' }] as const) {
      expect(await changeMembership(repository, { accountId: 'a', change })).toEqual({
        ok: false,
        code: 'ERR_LAST_MAIN',
      });
    }
    expect(state.accounts[0]).toEqual(account('a'));
  });

  it('tài khoản không tồn tại hoặc chưa thuộc nhóm nào trả ERR_NOT_FOUND', async () => {
    const { repository } = setup([account('w', { familyId: null, role: null })]);
    for (const accountId of ['x', 'w']) {
      expect(await changeMembership(repository, { accountId, change: { action: 'remove' } })).toEqual({
        ok: false,
        code: 'ERR_NOT_FOUND',
      });
    }
  });
});
