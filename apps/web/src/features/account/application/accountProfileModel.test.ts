import { expect, it } from 'vitest';
import { buildAccountProfileModel } from './accountProfileModel';

const base = {
  account: { id: 'acc', displayName: 'Đào Ngọc Lan', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'fam', name: 'Nhà Ngọc Lan', isOwner: false },
  role: 'main' as const,
};

it('lấy chữ cái đầu tiếng Việt có dấu và tên nhà từ phiên', () => {
  expect(buildAccountProfileModel(base)).toEqual({
    initial: 'Đ',
    displayName: 'Đào Ngọc Lan',
    familyName: 'Nhà Ngọc Lan',
    roleLabel: 'Đồng quản lý',
  });
});

it.each([
  [{ id: 'f', name: 'Nhà An', isOwner: true }, 'main' as const, 'Chủ hộ'],
  [{ id: 'f', name: 'Nhà An', isOwner: false }, 'main' as const, 'Đồng quản lý'],
  [{ id: 'f', name: 'Nhà An', isOwner: false }, 'member' as const, 'Thành viên'],
])('ánh xạ đúng vai trò thành viên qua memberRoleLabel: %s', (family, role, expected) => {
  const model = buildAccountProfileModel({ ...base, family, role });
  expect(model.roleLabel).toBe(expected);
});

it('chưa có nhà hiển thị Chưa có nhà và không gán vai trò giả', () => {
  const model = buildAccountProfileModel({ ...base, family: null, role: null });
  expect(model.familyName).toBe('Chưa có nhà');
  expect(model.roleLabel).toBeNull();
});
