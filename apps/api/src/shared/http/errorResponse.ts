import type { ErrorResponse } from '@angia/contracts';
import type { Context } from 'hono';

// Mã lỗi đang dùng, thông điệp đúng nguyên văn SDD §4.1–4.2.
const ERROR_CATALOG = {
  ERR_UNAUTHENTICATED: {
    status: 401,
    message: 'Phiên làm việc đã kết thúc hoặc không hợp lệ. Vui lòng đăng nhập lại.',
  },
  ERR_FORBIDDEN: { status: 403, message: 'Bạn không có quyền thực hiện thao tác này.' },
  ERR_NOT_FOUND: { status: 404, message: 'Không tìm thấy tài nguyên yêu cầu.' },
  ERR_ACCOUNT_ALREADY_IN_FAMILY: { status: 409, message: 'Tài khoản này đã thuộc một nhóm gia đình khác.' },
  ERR_FIRST_ACCOUNT_MUST_BE_MAIN: {
    status: 409,
    message: 'Người đầu tiên của nhóm gia đình bắt buộc phải là người chăm sóc chính.',
  },
  ERR_LAST_MAIN: {
    status: 409,
    message: 'Nhóm gia đình bắt buộc phải duy trì ít nhất một người chăm sóc chính.',
  },
  ERR_VALIDATION: { status: 422, message: 'Dữ liệu gửi lên không đúng định dạng quy định.' },
  ERR_INTERNAL: { status: 500, message: 'Đã xảy ra lỗi nội bộ hệ thống. Vui lòng thử lại sau.' },
} as const;

type ErrorCode = keyof typeof ERROR_CATALOG;

// Đối số [thân, mã HTTP literal] cho `c.json(...errorJson(code))` trong handler OpenAPI đã khai báo kiểu response.
export function errorJson<Code extends ErrorCode>(code: Code) {
  const { status, message } = ERROR_CATALOG[code];
  const body: ErrorResponse = { error: { code, message } };
  return [body, status as (typeof ERROR_CATALOG)[Code]['status']] as const;
}

// Phản hồi lỗi theo cấu trúc chuẩn SDD §4.3; không bao giờ kèm stack trace hay chi tiết hạ tầng.
export function errorResponse(c: Context, code: ErrorCode): Response {
  return c.json(...errorJson(code));
}
