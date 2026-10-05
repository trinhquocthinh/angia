import type { ErrorResponse } from '@angia/contracts';
import type { Context } from 'hono';

// Mã lỗi nền tảng đang dùng, thông điệp đúng nguyên văn SDD §4.1–4.2.
const ERROR_CATALOG = {
  ERR_UNAUTHENTICATED: {
    status: 401,
    message: 'Phiên làm việc đã kết thúc hoặc không hợp lệ. Vui lòng đăng nhập lại.',
  },
  ERR_FORBIDDEN: { status: 403, message: 'Bạn không có quyền thực hiện thao tác này.' },
  ERR_INTERNAL: { status: 500, message: 'Đã xảy ra lỗi nội bộ hệ thống. Vui lòng thử lại sau.' },
} as const;

type ErrorCode = keyof typeof ERROR_CATALOG;

// Phản hồi lỗi theo cấu trúc chuẩn SDD §4.3; không bao giờ kèm stack trace hay chi tiết hạ tầng.
export function errorResponse(c: Context, code: ErrorCode): Response {
  const { status, message } = ERROR_CATALOG[code];
  const body: ErrorResponse = { error: { code, message } };
  return c.json(body, status);
}
