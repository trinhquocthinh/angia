import { expect, it } from 'vitest';
import { canManageMember, memberInitials, memberRoleDescription, memberRoleLabel } from './memberDisplay';

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

it('SPEC-066: mô tả vai trò khớp quyết định owner và tạo chữ cái đại diện từ tên', () => {
  expect(memberRoleDescription('main')).toBe('Quản lý hồ sơ');
  expect(memberRoleDescription('member')).toBe('Chỉ xem hồ sơ');
  expect(memberInitials('Anh Tuấn')).toBe('AT');
  expect(memberInitials('Lan')).toBe('L');
  expect(memberInitials('   ')).toBe('?');
});
