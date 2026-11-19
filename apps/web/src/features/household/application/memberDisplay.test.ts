import { expect, it } from 'vitest';
import { canManageMember, memberRoleTag, memberRoleDescription, memberRoleLabel } from './memberDisplay';

it('SPEC-066: nhãn vai trò phân biệt Chủ hộ, Đồng quản lý và Thành viên', () => {
  expect(memberRoleLabel({ isOwner: true, role: 'main' })).toBe('Chủ hộ');
  expect(memberRoleLabel({ isOwner: false, role: 'main' })).toBe('Đồng quản lý');
  expect(memberRoleLabel({ isOwner: false, role: 'member' })).toBe('Thành viên');
});

it('SPEC-066: chỉ main thao tác được người khác không phải Chủ hộ và không phải chính mình', () => {
  expect(canManageMember('main', { isOwner: false, isSelf: false })).toBe(true);
  expect(canManageMember('main', { isOwner: true, isSelf: false })).toBe(false);
  expect(canManageMember('main', { isOwner: false, isSelf: true })).toBe(false);
  expect(canManageMember('member', { isOwner: false, isSelf: false })).toBe(false);
});

it('SPEC-066: mô tả đầy đủ quyền quản lý và giới hạn của từng vai trò', () => {
  expect(memberRoleDescription('main')).toBe(
    'Quản lý hồ sơ sức khỏe và thành viên trong nhà: mời người thân, đổi vai trò và gỡ thành viên.',
  );
  expect(memberRoleDescription('member')).toBe(
    'Chỉ xem hồ sơ được liên kết với mình. Không mời, đổi vai trò hay gỡ thành viên khác.',
  );
});

it('SPEC-066: chip quyền hạn phân biệt Toàn quyền và Giới hạn', () => {
  expect(memberRoleTag('main')).toBe('Toàn quyền');
  expect(memberRoleTag('member')).toBe('Giới hạn');
});
