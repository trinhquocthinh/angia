import { createRoute, z } from '@hono/zod-openapi';
import { errorResponseSchema, visitSummaryQuerySchema, visitSummarySchema } from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});

export const visitSummaryRoute = createRoute({
  method: 'get',
  path: '/api/health-profiles/{id}/visit-summary',
  tags: ['visit-summary'],
  summary: 'Dữ liệu bản tóm tắt hồ sơ tái khám (SPEC-024), mặc định 3 tháng gần nhất',
  request: { params: z.object({ id: z.uuid() }), query: visitSummaryQuerySchema },
  responses: {
    200: {
      description: 'Thuốc đang dùng, số đo, xét nghiệm mới nhất, giai đoạn dùng thuốc và dòng miễn trừ',
      content: { 'application/json': { schema: visitSummarySchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN'),
    404: error('ERR_NOT_FOUND: hồ sơ không thuộc gia đình'),
    409: error('ERR_CONSENT_REQUIRED'),
    422: error('ERR_VALIDATION: from > to, to sau hôm nay hoặc khoảng quá 366 ngày'),
  },
});
