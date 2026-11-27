import { createRoute } from '@hono/zod-openapi';
import { adminStatsQuerySchema, adminStatsResponseSchema, errorResponseSchema } from '@angia/contracts';

export const getAdminStatsRoute = createRoute({
  method: 'get',
  path: '/api/admin/stats',
  tags: ['adminStats'],
  summary: 'SystemAdmin OIDC đọc Thống kê không định danh (SPEC-077)',
  request: { query: adminStatsQuerySchema },
  responses: {
    200: {
      description: 'Thống kê không định danh (SPEC-077)',
      content: { 'application/json': { schema: adminStatsResponseSchema } },
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
