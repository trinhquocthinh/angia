import { createRoute, z } from '@hono/zod-openapi';
import { errorResponseSchema } from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
export const accountDeletionRoute = createRoute({
  method: 'post',
  path: '/api/me/account-deletion',
  tags: ['auth'],
  summary: 'Xoá tài khoản và ẩn danh thông tin định danh (SPEC-073)',
  description: 'Cần phiên, Origin tin cậy và X-CSRF-Token; không yêu cầu đã đồng ý pháp lý hoặc thuộc nhà.',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: z
            .object({
              password: z.string().min(1).max(1024),
              ownProfileDisposition: z.enum(['keep', 'delete']).optional(),
            })
            .strict(),
        },
      },
    },
  },
  responses: {
    204: { description: 'Đã xoá tài khoản và cookie phiên/thiết bị Push' },
    422: error('ERR_VALIDATION: body sai hoặc thiếu lựa chọn hồ sơ liên kết'),
    401: error('ERR_UNAUTHENTICATED; ERR_INVALID_CREDENTIALS: mật khẩu sai hoặc không có credential local'),
    403: error('ERR_FORBIDDEN: Origin/CSRF sai; ERR_ACCOUNT_LOCKED: tài khoản bị khoá'),
    409: error(
      'ERR_OWNER_MUST_TRANSFER; ERR_OWNER_MUST_DELETE_FAMILY; ERR_LAST_GUARDIAN (details.profileIds)',
    ),
    429: {
      ...error('ERR_RATE_LIMITED: quá nhiều lần sai'),
      headers: { 'Retry-After': { schema: { type: 'integer', minimum: 1 } } },
    },
    503: error('ERR_AUTH_UNAVAILABLE: xác thực tạm gián đoạn'),
  },
});
