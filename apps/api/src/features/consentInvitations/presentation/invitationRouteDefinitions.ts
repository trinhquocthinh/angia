import { createRoute, z } from '@hono/zod-openapi';
import {
  consentInvitationCreatedSchema,
  consentInvitationRevokedSchema,
  consentInvitationViewSchema,
  consentInvitationRespondRequestSchema,
  consentInvitationReceiptSchema,
  errorResponseSchema,
} from '@angia/contracts';

const json = <T extends z.ZodType>(schema: T) => ({ 'application/json': { schema } });
const error = (description: string) => ({ description, content: json(errorResponseSchema) });
const params = z.object({ id: z.uuid() });
const mainErrors = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN'),
  404: error('ERR_NOT_FOUND'),
  409: error('ERR_CONSENT_ALREADY_CONFIRMED'),
  422: error('ERR_VALIDATION'),
};
const mainPath = '/api/health-profiles/{id}/consent-invitations';
export const createInvitationRoute = createRoute({
  method: 'post',
  path: mainPath,
  tags: ['consent-invitations'],
  request: { params },
  responses: {
    201: { description: 'Link mới, hết hạn sau 7 ngày', content: json(consentInvitationCreatedSchema) },
    ...mainErrors,
  },
});
export const revokeInvitationRoute = createRoute({
  method: 'delete',
  path: mainPath,
  tags: ['consent-invitations'],
  request: { params },
  responses: {
    200: { description: 'Đã thu hồi link đang chờ', content: json(consentInvitationRevokedSchema) },
    ...mainErrors,
  },
});
export const viewInvitationRoute = createRoute({
  method: 'get',
  path: '/api/consent-invitations/view',
  tags: ['consent-invitations'],
  security: [{ invitationToken: [] }],
  responses: {
    200: {
      description: 'Thông tin tối thiểu, không tiêu thụ token',
      content: json(consentInvitationViewSchema),
    },
    404: error('ERR_NOT_FOUND'),
  },
});
export const respondInvitationRoute = createRoute({
  method: 'post',
  path: '/api/consent-invitations/respond',
  tags: ['consent-invitations'],
  security: [{ invitationToken: [] }],
  request: { body: { required: true, content: json(consentInvitationRespondRequestSchema) } },
  responses: {
    200: {
      description: 'Giữ quyết định và metadata phản hồi đầu',
      content: json(consentInvitationReceiptSchema),
    },
    403: error('ERR_FORBIDDEN: Origin'),
    404: error('ERR_NOT_FOUND'),
    422: error('ERR_VALIDATION'),
  },
});
