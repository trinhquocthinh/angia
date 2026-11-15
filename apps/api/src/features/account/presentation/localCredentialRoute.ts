import { createRoute } from '@hono/zod-openapi';
import { localCredentialRequestSchema, errorResponseSchema } from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});

export const localCredentialRoute = createRoute({
  method: 'post',
  path: '/api/me/local-credential',
  tags: ['account'],
  summary: 'Thiết lập mật khẩu local một lần trước cutover (SPEC-060)',
  description:
    'Cần LOCAL_ENROLLMENT_ENABLED, phiên OIDC reauth tối đa 300 giây và X-CSRF-Token. Cache-Control: no-store.',
  request: {
    body: { required: true, content: { 'application/json': { schema: localCredentialRequestSchema } } },
  },
  responses: {
    204: { description: 'Đã thiết lập mật khẩu, giữ nguyên tài khoản và phiên' },
    401: error('ERR_UNAUTHENTICATED: thiếu phiên hoặc account/phiên đã bị xoá'),
    403: error(
      'ERR_FORBIDDEN: CSRF sai hoặc chưa reauth OIDC hợp lệ; ERR_ACCOUNT_LOCKED: tài khoản đã bị khoá',
    ),
    404: error('ERR_NOT_FOUND: cờ enrollment tắt'),
    409: error('ERR_CREDENTIAL_ALREADY_SET: đã có credential, không ghi đè'),
    422: error('ERR_VALIDATION: body hoặc mật khẩu không hợp lệ, details.field=password'),
    503: error('ERR_AUTH_UNAVAILABLE: DB/hash lỗi hoặc hash bận'),
  },
});
