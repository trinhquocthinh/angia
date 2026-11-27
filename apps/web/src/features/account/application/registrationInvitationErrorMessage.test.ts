import { expect, it } from 'vitest';
import { registrationInvitationErrorMessage } from './registrationInvitationErrorMessage';

it('SPEC-065: đăng ký với lời mời vô hiệu cho biết vẫn có thể đăng ký khi mở', () => {
  expect(registrationInvitationErrorMessage('ERR_NOT_FOUND')).toBe(
    'Lời mời không còn dùng được. Bạn vẫn có thể tạo tài khoản nếu đăng ký đang mở.',
  );
});
it('SPEC-065: nhà đang xoá dùng thông báo nhận lời mời, lỗi khác dùng catalog cũ', () => {
  expect(registrationInvitationErrorMessage('ERR_DELETION_PENDING')).toBe(
    'Nhà đang chờ xoá. Chưa thể nhận lời mời.',
  );
  expect(registrationInvitationErrorMessage('ERR_REGISTRATION_CLOSED')).toBeNull();
  expect(registrationInvitationErrorMessage('ERR_USERNAME_TAKEN')).toBeNull();
});
