import { createRoute } from '@hono/zod-openapi';
import {
  errorResponseSchema,
  passwordLoginRequestSchema,
  passwordLoginResponseSchema,
  registerAccountRequestSchema,
  registerAccountResponseSchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});

export const registerAccountRoute = createRoute({
  method: 'post',
  path: '/api/auth/register',
  tags: ['auth'],
  summary: 'Tạo tài khoản local và phiên (SPEC-059)',
  description:
    'Không cần phiên. Bắt buộc application/json và Origin khớp chính xác origin APP_BASE_URL. Cookie angia_session HttpOnly, SameSite=Lax; phản hồi Cache-Control: no-store.',
  request: {
    body: { required: true, content: { 'application/json': { schema: registerAccountRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Tài khoản và CSRF token; sessionId chỉ nằm trong cookie đã ký',
      content: { 'application/json': { schema: registerAccountResponseSchema } },
    },
    403: error(
      'ERR_FORBIDDEN: thiếu/sai Origin hoặc không phải JSON; ERR_REGISTRATION_CLOSED: chưa mở đăng ký và không có lời mời hợp lệ',
    ),
    404: error('ERR_NOT_FOUND: lời mời đã hết hiệu lực trước khi ghi đăng ký'),
    409: error(
      'ERR_DELETION_PENDING; ERR_USERNAME_TAKEN; ERR_LEGAL_VERSION_OUTDATED kèm details.current = { termsVersionId, privacyVersionId }',
    ),
    429: error(
      'ERR_RATE_LIMITED: vượt 5 request/IP/giờ; header Retry-After là số giây nguyên tới hết cửa sổ',
    ),
    503: error('ERR_AUTH_UNAVAILABLE: rate limiter gián đoạn hoặc hàng đợi hash đã đầy; không tạo phiên'),
    422: error('ERR_VALIDATION: body thiếu/sai kiểu hoặc quy tắc domain không hợp lệ (details.field)'),
  },
});

export const passwordLoginRoute = createRoute({
  method: 'post',
  path: '/api/auth/password-login',
  tags: ['auth'],
  summary: 'Đăng nhập local và cấp phiên (SPEC-060)',
  description:
    'Không cần phiên. Origin khớp chính xác APP_BASE_URL, application/json. Cache-Control: no-store; cookie angia_session đã ký, HttpOnly, SameSite=Lax.',
  request: {
    body: { required: true, content: { 'application/json': { schema: passwordLoginRequestSchema } } },
  },
  responses: {
    200: {
      description: 'CSRF, hạn phiên 30 ngày và cờ bắt đổi mật khẩu; không trả sessionId',
      content: { 'application/json': { schema: passwordLoginResponseSchema } },
    },
    401: error(
      'ERR_INVALID_CREDENTIALS: sai/thiếu credential, mật khẩu tạm hết hạn hoặc snapshot không còn hợp lệ',
    ),
    403: error('ERR_FORBIDDEN: Origin/JSON sai; ERR_ACCOUNT_LOCKED: tài khoản đã bị khoá'),
    422: error('ERR_VALIDATION: username/password thiếu, rỗng hoặc quá giới hạn'),
    429: {
      ...error('ERR_RATE_LIMITED: 10 lần sai/15 phút theo IP và username chữ thường'),
      headers: {
        'Retry-After': { schema: { type: 'integer', minimum: 1 }, description: 'Số giây tới hết cửa sổ' },
      },
    },
    503: error('ERR_AUTH_UNAVAILABLE: DB/hash/rate limiter lỗi, timeout hoặc hash bận; không cấp phiên'),
  },
});
