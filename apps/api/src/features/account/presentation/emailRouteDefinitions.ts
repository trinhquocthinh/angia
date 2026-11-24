import { createRoute } from '@hono/zod-openapi';
import {
  changeAccountEmailRequestSchema,
  accountEmailResponseSchema,
  requestEmailVerificationResponseSchema,
  confirmEmailVerificationRequestSchema,
  errorResponseSchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
const errors = {
  400: error('ERR_VERIFICATION_TOKEN_INVALID: liên kết không hợp lệ hoặc hết hạn'),
  401: error('ERR_UNAUTHENTICATED; ERR_INVALID_CREDENTIALS: mật khẩu hiện tại sai'),
  403: error('ERR_FORBIDDEN: CSRF/Origin/JSON sai; ERR_ACCOUNT_LOCKED; ERR_PASSWORD_CHANGE_REQUIRED'),
  409: error('ERR_EMAIL_TAKEN: email đã được tài khoản khác xác minh'),
  422: error('ERR_VALIDATION: dữ liệu không hợp lệ hoặc chưa có email'),
  429: {
    ...error('ERR_RATE_LIMITED: tối đa 3 lần gửi mỗi giờ/tài khoản'),
    headers: { 'Retry-After': { schema: { type: 'integer' as const, minimum: 1 } } },
  },
  503: error('ERR_AUTH_UNAVAILABLE: xác thực hoặc lưu trữ tạm gián đoạn'),
};
export const changeAccountEmailRoute = createRoute({
  method: 'patch',
  path: '/api/me/email',
  tags: ['auth'],
  summary: 'Thêm/đổi email bằng mật khẩu hiện tại (SPEC-085)',
  description: 'Cần phiên và X-CSRF-Token. Không gửi mail. Cache-Control: no-store.',
  request: {
    body: { required: true, content: { 'application/json': { schema: changeAccountEmailRequestSchema } } },
  },
  responses: {
    ...errors,
    200: {
      description: 'Trạng thái email hiện tại',
      content: { 'application/json': { schema: accountEmailResponseSchema } },
    },
  },
});
export const requestEmailVerificationRoute = createRoute({
  method: 'post',
  path: '/api/me/email-verifications',
  tags: ['auth'],
  summary: 'Gửi link xác minh email (SPEC-085)',
  description:
    'Cần phiên và X-CSRF-Token, body rỗng. Chỉ lượt gửi 202 tiêu hạn mức. Cache-Control: no-store.',
  responses: {
    ...errors,
    202: {
      description: 'Đã xếp email vào hàng đợi',
      content: { 'application/json': { schema: requestEmailVerificationResponseSchema } },
    },
    204: { description: 'Email đã xác minh và không có email chờ đổi' },
  },
});
export const confirmEmailVerificationRoute = createRoute({
  method: 'post',
  path: '/api/auth/email-verifications/confirm',
  tags: ['auth'],
  summary: 'Xác nhận email bằng token một lần (SPEC-085)',
  description: 'Không cần phiên. Cần application/json và Origin tin cậy. Cache-Control: no-store.',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: confirmEmailVerificationRequestSchema } },
    },
  },
  responses: { ...errors, 204: { description: 'Đã xác minh email' } },
});
