import { createRoute } from '@hono/zod-openapi';
import {
  createHouseholdInvitationRequestSchema,
  householdInvitationResponseSchema,
  errorResponseSchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});

export const createHouseholdInvitationRoute = createRoute({
  method: 'post',
  path: '/api/family/invitations',
  tags: ['household'],
  summary: 'Mời người thân vào nhà (SPEC-065)',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: createHouseholdInvitationRequestSchema } },
    },
  },
  responses: {
    201: {
      description: 'Link, mã và hạn lời mời',
      content: { 'application/json': { schema: householdInvitationResponseSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN | ERR_PASSWORD_CHANGE_REQUIRED | ERR_LEGAL_ACCEPTANCE_REQUIRED'),
    404: error('ERR_NOT_FOUND'),
    409: error('ERR_DELETION_PENDING | ERR_INVITATION_EXISTS'),
    422: error('ERR_VALIDATION'),
  },
});
