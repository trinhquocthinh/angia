import { createRoute, z } from '@hono/zod-openapi';
import { changeHouseholdMemberRequestSchema, errorResponseSchema } from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});

export const changeHouseholdMemberRoute = createRoute({
  method: 'patch',
  path: '/api/family/members/{targetAccountId}',
  tags: ['household'],
  summary: 'Đổi vai trò hoặc gỡ người khác khỏi nhà (SPEC-066)',
  request: {
    params: z.object({ targetAccountId: z.uuid() }),
    body: { required: true, content: { 'application/json': { schema: changeHouseholdMemberRequestSchema } } },
  },
  responses: {
    204: { description: 'Đã cập nhật thành viên' },
    401: error('ERR_UNAUTHENTICATED'),
    403: error(
      'ERR_FORBIDDEN | ERR_OWNER_PROTECTED | ERR_PASSWORD_CHANGE_REQUIRED | ERR_LEGAL_ACCEPTANCE_REQUIRED',
    ),
    404: error('ERR_NOT_FOUND'),
    409: error('ERR_LAST_GUARDIAN'),
    422: error('ERR_VALIDATION'),
  },
});
