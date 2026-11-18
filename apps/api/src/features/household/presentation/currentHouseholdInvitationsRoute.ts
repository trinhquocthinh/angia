import { createRoute } from '@hono/zod-openapi';
import { currentHouseholdInvitationsSchema, errorResponseSchema } from '@angia/contracts';
const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
export const currentHouseholdInvitationsRoute = createRoute({
  method: 'get',
  path: '/api/family/invitations/current',
  tags: ['household'],
  summary: 'Hai lời mời hiện tại theo vai trò của chính người tạo',
  responses: {
    200: {
      description: 'Tối đa hai lời mời, không trả lịch sử',
      content: { 'application/json': { schema: currentHouseholdInvitationsSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN'),
    404: error('ERR_NOT_FOUND'),
    409: error('ERR_INVITATION_EXISTS | ERR_DELETION_PENDING'),
  },
});
