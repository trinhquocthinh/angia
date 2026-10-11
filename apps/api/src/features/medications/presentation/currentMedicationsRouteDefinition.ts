import { createRoute, z } from '@hono/zod-openapi';
import { currentMedicationsSchema, errorResponseSchema } from '@angia/contracts';
const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
export const listCurrentMedicationsRoute = createRoute({
  method: 'get',
  path: '/api/health-profiles/{id}/medication-courses/current',
  tags: ['medications'],
  summary: 'Danh mục thuốc đang dùng hôm nay theo khoảng hiệu lực (SPEC-018)',
  request: { params: z.object({ id: z.uuid() }) },
  responses: {
    200: {
      description: 'Ngày Việt Nam và các đợt có hiệu lực hôm nay',
      content: { 'application/json': { schema: currentMedicationsSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN'),
    404: error('ERR_NOT_FOUND'),
    409: error('ERR_CONSENT_REQUIRED'),
    422: error('ERR_VALIDATION'),
  },
});
