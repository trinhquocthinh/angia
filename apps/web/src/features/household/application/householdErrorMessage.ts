export function householdErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    ERR_REGISTRATION_CLOSED: 'Hiện chưa mở đăng ký. Bạn cần lời mời để tham gia.',
    ERR_ACCOUNT_ALREADY_IN_FAMILY: 'Tài khoản này đã thuộc một nhóm gia đình khác.',
    ERR_NOT_FOUND: 'Lời mời không còn hiệu lực. Hãy nhờ người mời gửi lại.',
    ERR_LEGAL_ACCEPTANCE_REQUIRED: 'Vui lòng đọc và đồng ý Điều khoản mới để tiếp tục.',
    ERR_PASSWORD_CHANGE_REQUIRED: 'Bạn cần đặt mật khẩu mới trước khi tiếp tục.',
    ERR_VALIDATION: 'Dữ liệu gửi lên không đúng định dạng quy định.',
    ERR_UNAUTHENTICATED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    ERR_FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
    ERR_RATE_LIMITED: 'Bạn thao tác quá nhanh, vui lòng thử lại sau.',
    NETWORK: 'Mất kết nối. Kiểm tra mạng rồi thử lại.',
  };
  return Object.hasOwn(messages, code) ? messages[code]! : 'Không thể tạo nhà. Vui lòng thử lại.';
}
