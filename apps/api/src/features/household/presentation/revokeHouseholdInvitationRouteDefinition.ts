import { createRoute, z } from '@hono/zod-openapi';
import { errorResponseSchema } from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});

export const revokeHouseholdInvitationRoute = createRoute({
  method: 'delete',
  path: '/api/family/invitations/{id}',
  tags: ['household'],
  summary: 'Thu hồi lời mời vào nhà (SPEC-065)',
  request: { params: z.object({ id: z.uuid() }) },
  responses: {
    204: { description: 'Đã thu hồi lời mời' },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN | ERR_PASSWORD_CHANGE_REQUIRED | ERR_LEGAL_ACCEPTANCE_REQUIRED'),
    404: error('ERR_NOT_FOUND'),
    409: error('ERR_DELETION_PENDING'),
    422: error('ERR_VALIDATION'),
  },
});
