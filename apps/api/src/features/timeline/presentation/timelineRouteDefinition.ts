import { createRoute, z } from '@hono/zod-openapi';
import { errorResponseSchema, timelinePageSchema, timelineQuerySchema } from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
export const timelineRoute = createRoute({
  method: 'get',
  path: '/api/health-profiles/{id}/timeline',
  tags: ['timeline'],
  summary: 'Dòng thời gian sáu loại sự kiện đã ghi nhận (SPEC-049, E13-S5-T1)',
  request: { params: z.object({ id: z.uuid() }), query: timelineQuerySchema },
  responses: {
    200: {
      description: 'Trang dòng thời gian không kèm nhận định',
      content: { 'application/json': { schema: timelinePageSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN'),
    404: error('ERR_NOT_FOUND'),
    409: error('ERR_CONSENT_REQUIRED'),
    422: error('ERR_VALIDATION'),
  },
});
