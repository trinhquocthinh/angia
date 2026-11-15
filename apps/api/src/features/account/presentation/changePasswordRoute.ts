import { createRoute } from '@hono/zod-openapi';
import { changePasswordRequestSchema, errorResponseSchema } from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
export const changePasswordRoute = createRoute({
  method: 'post',
  path: '/api/me/password',
  tags: ['auth'],
  summary: 'Đổi mật khẩu local và thu hồi phiên khác (SPEC-060)',
  description:
    'Cần phiên và X-CSRF-Token. Cache-Control: no-store. Giữ nguyên cookie, CSRF và hạn phiên hiện tại.',
  request: {
    body: { required: true, content: { 'application/json': { schema: changePasswordRequestSchema } } },
  },
  responses: {
    204: { description: 'Đã đổi mật khẩu; phiên hiện tại trở về bình thường' },
    401: error(
      'ERR_UNAUTHENTICATED; ERR_INVALID_CREDENTIALS: mật khẩu cũ sai, không có local credential hoặc version đã đổi',
    ),
    403: error('ERR_FORBIDDEN: CSRF sai; ERR_ACCOUNT_LOCKED: tài khoản đã bị khoá'),
    422: error('ERR_VALIDATION: body hoặc mật khẩu không hợp lệ, details.field'),
    429: {
      ...error('ERR_RATE_LIMITED: quá nhiều lần sai'),
      headers: { 'Retry-After': { schema: { type: 'integer', minimum: 1 } } },
    },
    503: error('ERR_AUTH_UNAVAILABLE: DB/rate limiter/hash lỗi hoặc hash bận'),
  },
});
