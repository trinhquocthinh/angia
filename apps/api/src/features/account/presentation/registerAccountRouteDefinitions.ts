import { createRoute } from '@hono/zod-openapi';
import {
  errorResponseSchema,
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
    409: error(
      'ERR_USERNAME_TAKEN; ERR_LEGAL_VERSION_OUTDATED kèm details.current = { termsVersionId, privacyVersionId }',
    ),
    429: error(
      'ERR_RATE_LIMITED: vượt 5 request/IP/giờ; header Retry-After là số giây nguyên tới hết cửa sổ',
    ),
    503: error('ERR_AUTH_UNAVAILABLE: rate limiter gián đoạn hoặc hàng đợi hash đã đầy; không tạo phiên'),
    422: error('ERR_VALIDATION: body thiếu/sai kiểu hoặc quy tắc domain không hợp lệ (details.field)'),
  },
});
