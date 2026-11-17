import { createRoute, z } from '@hono/zod-openapi';
import {
  createFoundingInvitationRequestSchema,
  householdInvitationResponseSchema,
  errorResponseSchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
const errors = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN | ERR_PASSWORD_CHANGE_REQUIRED | ERR_LEGAL_ACCEPTANCE_REQUIRED'),
  422: error('ERR_VALIDATION'),
};

export const createFoundingInvitationRoute = createRoute({
  method: 'post',
  path: '/api/admin/founding-invitations',
  tags: ['household'],
  summary: 'SystemAdmin OIDC phát hành lời mời lập nhà (SPEC-065)',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: createFoundingInvitationRequestSchema } },
    },
  },
  responses: {
    201: {
      description: 'Link, mã và hạn 7 ngày',
      content: { 'application/json': { schema: householdInvitationResponseSchema } },
    },
    ...errors,
  },
});

export const revokeFoundingInvitationRoute = createRoute({
  method: 'delete',
  path: '/api/admin/founding-invitations/{id}',
  tags: ['household'],
  summary: 'Người tạo thu hồi lời mời lập nhà (SPEC-065)',
  request: { params: z.object({ id: z.uuid() }) },
  responses: { 204: { description: 'Đã thu hồi' }, 404: error('ERR_NOT_FOUND'), ...errors },
});
