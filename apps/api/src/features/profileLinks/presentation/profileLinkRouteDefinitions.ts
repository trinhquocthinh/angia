import { createRoute, z } from '@hono/zod-openapi';
import {
  errorResponseSchema,
  profileLinkAcceptRequestSchema,
  profileLinkCreateRequestSchema,
  profileLinkCreatedSchema,
  profileLinkReceiptSchema,
  profileLinkViewSchema,
} from '@angia/contracts';

const json = <T extends z.ZodType>(schema: T) => ({ 'application/json': { schema } });
const error = (description: string) => ({ description, content: json(errorResponseSchema) });
const params = z.object({ id: z.uuid() });
const mainErrors = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN'),
  404: error('ERR_NOT_FOUND'),
  409: error('ERR_PROFILE_ALREADY_LINKED'),
  422: error('ERR_VALIDATION'),
};
const mainPath = '/api/health-profiles/{id}/link-invitations';
export const createProfileLinkRoute = createRoute({
  method: 'post',
  path: mainPath,
  tags: ['profile-links'],
  request: { params, body: { required: true, content: json(profileLinkCreateRequestSchema) } },
  responses: {
    201: { description: 'Link mới, hết hạn sau 7 ngày', content: json(profileLinkCreatedSchema) },
    ...mainErrors,
  },
});
export const revokeProfileLinkRoute = createRoute({
  method: 'delete',
  path: mainPath,
  tags: ['profile-links'],
  request: { params },
  responses: { 204: { description: 'Đã thu hồi link đang chờ (idempotent)' }, ...mainErrors },
});
const sessionErrors = {
  401: error('ERR_UNAUTHENTICATED'),
  404: error('ERR_NOT_FOUND'),
};
export const viewProfileLinkRoute = createRoute({
  method: 'get',
  path: '/api/me/link-invitations/view',
  tags: ['profile-links'],
  security: [{ profileLinkToken: [] }],
  responses: {
    200: { description: 'Thông tin tối thiểu, không tiêu thụ token', content: json(profileLinkViewSchema) },
    ...sessionErrors,
  },
});
export const acceptProfileLinkRoute = createRoute({
  method: 'post',
  path: '/api/me/link-invitations/accept',
  tags: ['profile-links'],
  security: [{ profileLinkToken: [] }],
  request: { body: { required: true, content: json(profileLinkAcceptRequestSchema) } },
  responses: {
    200: { description: 'Kết quả liên kết hoặc từ chối', content: json(profileLinkReceiptSchema) },
    ...sessionErrors,
    403: error('ERR_FORBIDDEN: thiếu CSRF'),
    409: error('ERR_PROFILE_ALREADY_LINKED'),
    422: error('ERR_VALIDATION'),
  },
});
