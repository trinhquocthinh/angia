import { expect, it } from 'vitest';
import { buildEmailSettingsState } from './emailSettingsState';

const ownerFamily = { id: 'f', name: 'Nhà An', isOwner: true };
const managerFamily = { id: 'f', name: 'Nhà An', isOwner: false };
const ownerNotice = 'Bạn chưa xác minh email. Nếu quên mật khẩu, bạn sẽ không lấy lại được tài khoản.';
const memberNotice =
  'Bạn chưa xác minh email nên chưa dùng được Quên mật khẩu. Nếu quên mật khẩu, hãy nhờ Chủ hộ hoặc Đồng quản lý đặt lại.';

it('chưa có email hiển thị chế độ empty, không cho gửi xác minh và có dòng nhắc đúng vai trò', () => {
  const empty = { email: null, emailVerified: false, pendingEmail: null };
  expect(buildEmailSettingsState(empty, ownerFamily)).toEqual({
    mode: 'empty',
    canVerify: false,
    notice: ownerNotice,
  });
  expect(buildEmailSettingsState(empty, null)).toEqual({
    mode: 'empty',
    canVerify: false,
    notice: ownerNotice,
  });
  expect(buildEmailSettingsState(empty, managerFamily)).toEqual({
    mode: 'empty',
    canVerify: false,
    notice: memberNotice,
  });
});

it('có email chưa xác minh cho phép xác minh và giữ đúng hai biến thể dòng nhắc', () => {
  const unverified = { email: 'lan@example.com', emailVerified: false, pendingEmail: null };
  expect(buildEmailSettingsState(unverified, ownerFamily)).toEqual({
    mode: 'unverified',
    canVerify: true,
    notice: ownerNotice,
  });
  expect(buildEmailSettingsState(unverified, managerFamily)).toEqual({
    mode: 'unverified',
    canVerify: true,
    notice: memberNotice,
  });
});

it('TC-928: có pendingEmail khi email cũ đã xác minh thì cho xác minh nhưng không hiện dòng nhắc vàng', () => {
  const pending = {
    email: 'old@example.com',
    emailVerified: true,
    pendingEmail: 'new@example.com',
  };
  expect(buildEmailSettingsState(pending, ownerFamily)).toEqual({
    mode: 'pending',
    canVerify: true,
    notice: null,
  });
});

it('đã xác minh và không có pendingEmail thì không hiện nút xác minh và không hiện dòng nhắc', () => {
  const verified = { email: 'lan@example.com', emailVerified: true, pendingEmail: null };
  expect(buildEmailSettingsState(verified, ownerFamily)).toEqual({
    mode: 'verified',
    canVerify: false,
    notice: null,
  });
});
