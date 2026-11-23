import { expect, it } from 'vitest';
import { accountErrorMessage } from './accountErrorMessage';

it.each([
  ['ERR_INVALID_CREDENTIALS', 'Tên đăng nhập hoặc mật khẩu chưa đúng.'],
  ['ERR_ACCOUNT_LOCKED', 'Tài khoản đang bị khoá. Liên hệ quản trị.'],
  ['ERR_FORBIDDEN', 'Không thể kết nối. Vui lòng thử lại.'],
  ['ERR_RATE_LIMITED', 'Bạn thao tác quá nhanh, vui lòng thử lại sau.'],
  ['ERR_AUTH_UNAVAILABLE', 'Hệ thống xác thực đang bận hoặc tạm gián đoạn. Vui lòng thử lại sau.'],
  ['ERR_USERNAME_TAKEN', 'Tên đăng nhập này đã có người dùng.'],
  ['ERR_REGISTRATION_CLOSED', 'Hiện chưa mở đăng ký. Bạn cần lời mời để tham gia.'],
  ['ERR_LEGAL_VERSION_OUTDATED', 'Điều khoản vừa được cập nhật, vui lòng đọc lại.'],
  ['ERR_RESET_TOKEN_INVALID', 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'],
  ['ERR_VALIDATION', 'Dữ liệu gửi lên không đúng định dạng quy định.'],
  ['NETWORK', 'Mất kết nối. Kiểm tra mạng rồi thử lại.'],
  ['UNKNOWN', 'Không thể kết nối. Vui lòng thử lại.'],
])('mã %s dùng chuỗi catalog, không lộ message máy chủ', (code, message) => {
  expect(accountErrorMessage(code)).toBe(message);
});
it.each(['toString', 'constructor', '__proto__'])('mã lạ %s vẫn dùng chuỗi lỗi chung', (code) => {
  expect(accountErrorMessage(code)).toBe('Không thể kết nối. Vui lòng thử lại.');
});
