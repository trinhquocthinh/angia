import { createRoute, z } from '@hono/zod-openapi';
import {
  errorResponseSchema,
  measurementListQuerySchema,
  measurementPageSchema,
  measurementSeriesQuerySchema,
  measurementSeriesSchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
const commonErrors = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN'),
  404: error('ERR_NOT_FOUND: hồ sơ không thuộc gia đình'),
  409: error('ERR_CONSENT_REQUIRED: hồ sơ chưa đồng thuận hoặc đã rút đồng thuận'),
  422: error('ERR_VALIDATION'),
};

export const listMeasurementsRoute = createRoute({
  method: 'get',
  path: '/api/health-profiles/{id}/measurements',
  tags: ['measurements'],
  summary: 'Số đo sinh tồn đã duyệt của hồ sơ, mới nhất trước, phân trang cursor (F09a)',
  request: { params: z.object({ id: z.uuid() }), query: measurementListQuerySchema },
  responses: {
    200: { description: 'Trang số đo', content: { 'application/json': { schema: measurementPageSchema } } },
    ...commonErrors,
  },
});

export const measurementSeriesRoute = createRoute({
  method: 'get',
  path: '/api/health-profiles/{id}/measurements/series',
  tags: ['measurements'],
  summary: 'Chuỗi số đo theo tuần trong khoảng ngày (SPEC-020), tối đa 366 ngày',
  request: { params: z.object({ id: z.uuid() }), query: measurementSeriesQuerySchema },
  responses: {
    200: {
      description: 'Điểm đo cũ nhất trước và cờ tuần có số đo',
      content: { 'application/json': { schema: measurementSeriesSchema } },
    },
    ...commonErrors,
  },
});
