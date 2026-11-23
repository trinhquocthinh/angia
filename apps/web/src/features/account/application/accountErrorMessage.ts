const messages: Record<string, string> = {
  ERR_INVALID_CREDENTIALS: 'Tên đăng nhập hoặc mật khẩu chưa đúng.',
  ERR_ACCOUNT_LOCKED: 'Tài khoản đang bị khoá. Liên hệ quản trị.',
  ERR_RATE_LIMITED: 'Bạn thao tác quá nhanh, vui lòng thử lại sau.',
  ERR_AUTH_UNAVAILABLE: 'Hệ thống xác thực đang bận hoặc tạm gián đoạn. Vui lòng thử lại sau.',
  ERR_USERNAME_TAKEN: 'Tên đăng nhập này đã có người dùng.',
  ERR_REGISTRATION_CLOSED: 'Hiện chưa mở đăng ký. Bạn cần lời mời để tham gia.',
  ERR_LEGAL_VERSION_OUTDATED: 'Điều khoản vừa được cập nhật, vui lòng đọc lại.',
  ERR_RESET_TOKEN_INVALID: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
  ERR_VALIDATION: 'Dữ liệu gửi lên không đúng định dạng quy định.',
  ERR_PASSWORD_CHANGE_REQUIRED: 'Bạn cần đặt mật khẩu mới trước khi tiếp tục.',
  ERR_CREDENTIAL_ALREADY_SET: 'Bạn đã thiết lập mật khẩu. Vui lòng đăng nhập.',
  NETWORK: 'Mất kết nối. Kiểm tra mạng rồi thử lại.',
};
export function accountErrorMessage(code: string): string {
  return (
    (Object.hasOwn(messages, code) ? messages[code] : undefined) ?? 'Không thể kết nối. Vui lòng thử lại.'
  );
}
