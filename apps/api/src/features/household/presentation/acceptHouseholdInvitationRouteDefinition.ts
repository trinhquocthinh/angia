import { createRoute } from '@hono/zod-openapi';
import { acceptHouseholdInvitationRequestSchema, errorResponseSchema } from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});

export const acceptHouseholdInvitationRoute = createRoute({
  method: 'post',
  path: '/api/invitations/accept',
  tags: ['household'],
  summary: 'Xác nhận lời mời vào nhà bằng token hoặc mã (SPEC-065)',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: acceptHouseholdInvitationRequestSchema } },
    },
  },
  responses: {
    204: { description: 'Đã vào nhà, không tự liên kết hồ sơ' },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN | ERR_PASSWORD_CHANGE_REQUIRED | ERR_LEGAL_ACCEPTANCE_REQUIRED'),
    404: error('ERR_NOT_FOUND'),
    409: error('ERR_ACCOUNT_ALREADY_IN_FAMILY | ERR_DELETION_PENDING'),
    422: error('ERR_VALIDATION'),
    429: error('ERR_RATE_LIMITED'),
    503: error('ERR_AUTH_UNAVAILABLE'),
  },
});
