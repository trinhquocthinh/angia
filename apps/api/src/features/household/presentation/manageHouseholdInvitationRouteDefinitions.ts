import { createRoute, z } from '@hono/zod-openapi';
import {
  managedHouseholdInvitationsSchema,
  listHouseholdInvitationsQuerySchema,
  householdInvitationResponseSchema,
  errorResponseSchema,
} from '@angia/contracts';
const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
const errors = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN'),
  404: error('ERR_NOT_FOUND'),
  409: error('ERR_DELETION_PENDING | ERR_INVITATION_EXISTS'),
  422: error('ERR_VALIDATION'),
};
export const listHouseholdInvitationsRoute = createRoute({
  method: 'get',
  path: '/api/family/invitations',
  tags: ['household'],
  summary: 'Danh sách lời mời và mã còn hiệu lực của người tạo',
  request: { query: listHouseholdInvitationsQuerySchema },
  responses: {
    200: {
      description: 'Lời mời trong nhà',
      content: { 'application/json': { schema: managedHouseholdInvitationsSchema } },
    },
    ...errors,
  },
});
export const replaceHouseholdInvitationRoute = createRoute({
  method: 'post',
  path: '/api/family/invitations/{id}/replace',
  tags: ['household'],
  summary: 'Thu hồi và thay mã trong cùng transaction',
  request: {
    params: z.object({ id: z.uuid() }),
    body: { required: true, content: { 'application/json': { schema: z.strictObject({}) } } },
  },
  responses: {
    201: {
      description: 'Lời mời mới',
      content: { 'application/json': { schema: householdInvitationResponseSchema } },
    },
    ...errors,
    429: error('ERR_RATE_LIMITED'),
    503: error('ERR_AUTH_UNAVAILABLE'),
  },
});
