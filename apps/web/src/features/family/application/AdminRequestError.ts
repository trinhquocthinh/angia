const messages: Record<string, string> = {
  ERR_UNAUTHENTICATED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  ERR_FORBIDDEN: 'Quyền quản trị hoặc phiên bảo mật đã thay đổi. Vui lòng thử lại.',
  ERR_VALIDATION: 'Vui lòng kiểm tra thông tin đã nhập.',
  ERR_NOT_FOUND: 'Tài khoản hoặc nhóm không còn tồn tại. Vui lòng tải lại danh sách.',
  ERR_ACCOUNT_ALREADY_IN_FAMILY: 'Tài khoản đã thuộc một nhóm. Vui lòng tải lại danh sách.',
  ERR_FIRST_ACCOUNT_MUST_BE_MAIN: 'Tài khoản đầu tiên của nhóm phải là Quản trị chính.',
  ERR_LAST_MAIN: 'Nhóm phải còn ít nhất một Quản trị chính. Hãy bổ sung người thay thế trước.',
};

export class AdminRequestError extends Error {
  constructor(
    readonly code: string,
    readonly status = 0,
  ) {
    super(messages[code] ?? 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.');
    this.name = 'AdminRequestError';
  }
}
