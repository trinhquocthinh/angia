import { createRoute } from '@hono/zod-openapi';
import { aiBillingViewSchema, errorResponseSchema } from '@angia/contracts';

export const getAiBillingRoute = createRoute({
  method: 'get',
  path: '/api/admin/ai-billing',
  tags: ['admin'],
  summary: 'Đọc phí thực đã xác nhận trong tháng Việt Nam và mức đầy đủ nguồn',
  responses: {
    200: {
      description: 'Metadata phí toàn hệ thống; actual chỉ có khi mọi nguồn đủ và mới',
      content: { 'application/json': { schema: aiBillingViewSchema } },
    },
    401: {
      description: 'ERR_UNAUTHENTICATED',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'ERR_FORBIDDEN: cần SystemAdmin',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});
