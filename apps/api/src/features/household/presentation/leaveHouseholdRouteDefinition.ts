import { createRoute } from '@hono/zod-openapi';
import { errorResponseSchema, leaveHouseholdRequestSchema } from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
export const leaveHouseholdRoute = createRoute({
  method: 'post',
  path: '/api/family/leave',
  tags: ['household'],
  summary: 'Tự rời nhà, giữ hoặc xoá hồ sơ liên kết (SPEC-067)',
  request: {
    body: { required: true, content: { 'application/json': { schema: leaveHouseholdRequestSchema } } },
  },
  responses: {
    204: { description: 'Đã rời nhà' },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN | ERR_PASSWORD_CHANGE_REQUIRED | ERR_LEGAL_ACCEPTANCE_REQUIRED'),
    404: error('ERR_NOT_FOUND'),
    409: error('ERR_OWNER_MUST_TRANSFER | ERR_OWNER_MUST_DELETE_FAMILY | ERR_LAST_GUARDIAN'),
    422: error('ERR_VALIDATION'),
  },
});
