import { createRoute, z } from '@hono/zod-openapi';
import { errorResponseSchema, measurementListQuerySchema, measurementSchema } from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});

export const listMeasurementsRoute = createRoute({
  method: 'get',
  path: '/api/health-profiles/{id}/measurements',
  tags: ['measurements'],
  summary: 'Số đo sinh tồn đã duyệt của hồ sơ, mới nhất trước',
  request: { params: z.object({ id: z.uuid() }), query: measurementListQuerySchema },
  responses: {
    200: { description: 'Số đo', content: { 'application/json': { schema: z.array(measurementSchema) } } },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN'),
    404: error('ERR_NOT_FOUND: hồ sơ không thuộc gia đình'),
  },
});
