import { createRoute } from '@hono/zod-openapi';
import { adminAuditQuerySchema, adminAuditResponseSchema, errorResponseSchema } from '@angia/contracts';

export const listAdminAuditEventsRoute = createRoute({
  method: 'get',
  path: '/api/admin/audit-events',
  tags: ['adminAudit'],
  summary: 'SystemAdmin OIDC đọc Nhật ký quản lý (SPEC-076)',
  request: { query: adminAuditQuerySchema },
  responses: {
    200: {
      description: 'Nhật ký quản lý (SPEC-076)',
      content: { 'application/json': { schema: adminAuditResponseSchema } },
    },
    401: {
      description: 'ERR_UNAUTHENTICATED',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'ERR_FORBIDDEN | ERR_PASSWORD_CHANGE_REQUIRED | ERR_LEGAL_ACCEPTANCE_REQUIRED',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    422: { description: 'ERR_VALIDATION', content: { 'application/json': { schema: errorResponseSchema } } },
  },
});
