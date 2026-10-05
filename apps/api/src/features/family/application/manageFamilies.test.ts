import { describe, expect, it } from 'vitest';
import { createFakeFamilyAdminRepository } from '@src/shared/test/createFakeFamilyAdminRepository.js';
import { createFamily } from './createFamily.js';
import { listAccounts } from './listAccounts.js';
import { listFamilies } from './listFamilies.js';

describe('createFamily / listFamilies / listAccounts', () => {
  it('nhóm mới được tạo và xuất hiện trong danh sách, chưa có tài khoản nào', async () => {
    const { repository } = createFakeFamilyAdminRepository();
    const family = await createFamily(repository, { name: 'Nhà Thịnh' });
    expect(family).toMatchObject({ name: 'Nhà Thịnh' });
    expect(await listFamilies(repository)).toEqual([family]);
    expect(await listAccounts(repository)).toEqual([]);
  });

  it('danh sách tài khoản gồm cả tài khoản chờ gán nhóm', async () => {
    const waiting = { id: 'w', displayName: 'W', isSystemAdmin: false, familyId: null, role: null };
    const { repository } = createFakeFamilyAdminRepository({ accounts: [waiting] });
    expect(await listAccounts(repository)).toEqual([waiting]);
  });
});
