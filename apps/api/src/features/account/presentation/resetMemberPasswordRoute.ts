import { createRoute } from '@hono/zod-openapi';
import {
  resetMemberPasswordParamsSchema,
  resetMemberPasswordResponseSchema,
  errorResponseSchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
export const resetMemberPasswordRoute = createRoute({
  method: 'post',
  path: '/api/family/members/{targetAccountId}/password-reset',
  tags: ['auth'],
  summary: 'Chủ hộ/Đồng quản lý đặt lại mật khẩu thành viên (SPEC-062)',
  description:
    'Cần phiên và X-CSRF-Token. Cache-Control: no-store. Mật khẩu tạm chỉ trả một lần, hết hạn sau 24 giờ.',
  request: { params: resetMemberPasswordParamsSchema },
  responses: {
    200: {
      description: 'Mật khẩu tạm và hạn dùng',
      content: { 'application/json': { schema: resetMemberPasswordResponseSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN; ERR_OWNER_PROTECTED'),
    404: error('ERR_NOT_FOUND'),
    422: error('ERR_VALIDATION: targetAccountId phải là UUID'),
    503: error('ERR_AUTH_UNAVAILABLE: DB/hash lỗi hoặc hash bận'),
  },
});
