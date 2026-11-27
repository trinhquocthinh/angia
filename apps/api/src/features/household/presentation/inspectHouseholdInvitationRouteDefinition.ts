import { createRoute } from '@hono/zod-openapi';
import {
  errorResponseSchema,
  inspectHouseholdInvitationRequestSchema,
  inspectHouseholdInvitationResponseSchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});

export const inspectHouseholdInvitationRoute = createRoute({
  method: 'post',
  path: '/api/invitations/inspect',
  tags: ['household'],
  summary: 'Kiểm tra loại lời mời công khai, không tiêu token (SPEC-065)',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: inspectHouseholdInvitationRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Chỉ trả loại và vai trò lời mời',
      content: { 'application/json': { schema: inspectHouseholdInvitationResponseSchema } },
    },
    403: error('ERR_FORBIDDEN'),
    404: error('ERR_NOT_FOUND'),
    422: error('ERR_VALIDATION'),
    429: {
      ...error('ERR_RATE_LIMITED'),
      headers: {
        'Retry-After': { description: 'Số giây chờ thử lại', schema: { type: 'string' } },
      },
    },
    503: error('ERR_AUTH_UNAVAILABLE'),
  },
});
