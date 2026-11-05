import { createRoute, z } from '@hono/zod-openapi';
import { consentConfirmationSchema, errorResponseSchema, healthProfileSchema } from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
export const consentAttestationRoute = createRoute({
  method: 'post',
  path: '/api/health-profiles/{id}/consent-attestation',
  tags: ['profiles'],
  summary: 'Cam kết đồng thuận hoặc tự xác nhận trong phiên main',
  request: {
    params: z.object({ id: z.uuid() }),
    body: { required: true, content: { 'application/json': { schema: consentConfirmationSchema } } },
  },
  responses: {
    200: {
      description: 'Hồ sơ đã đồng thuận, giữ nguyên receipt nếu đã confirmed',
      content: { 'application/json': { schema: healthProfileSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN: cần main và CSRF'),
    404: error('ERR_NOT_FOUND'),
    409: error('ERR_CONSENT_INVITATION_REQUIRED'),
    422: error('ERR_VALIDATION'),
  },
});
