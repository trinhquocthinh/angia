import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi';
import { errorResponseSchema, labSeriesQuerySchema, labSeriesResponseSchema } from '@angia/contracts';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { getLabSeries } from '../application/getLabSeries.js';
import type { LabResultRepository } from '../application/ports.js';
import { toLabResultResponse } from './toLabResultResponse.js';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});

const labSeriesRoute = createRoute({
  method: 'get',
  path: '/api/health-profiles/{id}/lab-result-series',
  tags: ['lab-results'],
  summary: 'Chuỗi biến thiên kết quả xét nghiệm theo chỉ số (SPEC-021), không phân trang',
  request: { params: z.object({ id: z.uuid() }), query: labSeriesQuerySchema },
  responses: {
    200: {
      description: 'Nhóm chỉ số có kết quả mới nhất trước; kết quả trong nhóm cũ nhất trước',
      content: { 'application/json': { schema: labSeriesResponseSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN'),
    404: error('ERR_NOT_FOUND: hồ sơ không thuộc gia đình'),
    422: error('ERR_VALIDATION'),
  },
});

// requireMain + no-store cho /api/health-profiles/* đã gắn ở registerProfileRoutes.
export function registerLabResultRoutes(app: OpenAPIHono<AppEnv>, repository: LabResultRepository): void {
  app.openapi(labSeriesRoute, async (c) => {
    const result = await getLabSeries(repository, {
      familyId: c.get('session')!.family!.id,
      profileId: c.req.valid('param').id,
      testName: c.req.valid('query').testName,
    });
    if (!result.ok) return c.json(...errorJson(result.code));
    const series = result.value.map((group) => ({
      testName: group.testName,
      results: group.results.map(toLabResultResponse),
    }));
    return c.json(series, 200);
  });
}
