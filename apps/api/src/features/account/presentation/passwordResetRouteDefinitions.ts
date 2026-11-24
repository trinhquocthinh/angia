import { createRoute } from '@hono/zod-openapi';
import {
  requestPasswordResetRequestSchema,
  requestPasswordResetResponseSchema,
  resetPasswordRequestSchema,
  errorResponseSchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
const common = {
  403: error('ERR_FORBIDDEN: Origin hoặc JSON không hợp lệ'),
  422: error('ERR_VALIDATION: dữ liệu không hợp lệ'),
  503: error('ERR_AUTH_UNAVAILABLE: dịch vụ xác thực tạm gián đoạn'),
};
export const requestPasswordResetRoute = createRoute({
  method: 'post',
  path: '/api/auth/password-reset-requests',
  tags: ['auth'],
  summary: 'Yêu cầu đặt lại mật khẩu qua email (SPEC-063)',
  description:
    'Không cần phiên. Origin tin cậy, JSON; Cache-Control: no-store. Đếm mọi yêu cầu theo IP và email chuẩn hoá, 3/giờ mỗi khoá. Luôn phản hồi đồng nhất trước khi tra email.',
  request: {
    body: { required: true, content: { 'application/json': { schema: requestPasswordResetRequestSchema } } },
  },
  responses: {
    ...common,
    202: {
      description: 'Đã nhận yêu cầu',
      content: { 'application/json': { schema: requestPasswordResetResponseSchema } },
    },
    429: {
      ...error('ERR_RATE_LIMITED: 3/giờ theo IP và email'),
      headers: { 'Retry-After': { schema: { type: 'integer' as const, minimum: 1 } } },
    },
  },
});
export const resetPasswordRoute = createRoute({
  method: 'post',
  path: '/api/auth/password-resets',
  tags: ['auth'],
  summary: 'Đặt mật khẩu mới bằng token một lần (SPEC-063)',
  description:
    'Không cần phiên. Origin tin cậy, JSON; Cache-Control: no-store. Token hết hạn sau 30 phút, thu hồi mọi phiên khi thành công.',
  request: {
    body: { required: true, content: { 'application/json': { schema: resetPasswordRequestSchema } } },
  },
  responses: {
    ...common,
    400: error('ERR_RESET_TOKEN_INVALID: Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'),
    204: { description: 'Đã đặt lại mật khẩu' },
  },
});
