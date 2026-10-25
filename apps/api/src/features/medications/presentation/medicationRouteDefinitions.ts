import { createRoute, z } from '@hono/zod-openapi';
import {
  createSelfReportedCourseRequestSchema,
  medicationCourseSchema,
  courseConflictErrorResponseSchema,
  errorResponseSchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
export const createSelfReportedCourseRoute = createRoute({
  method: 'post',
  path: '/api/health-profiles/{id}/medication-courses',
  tags: ['medications'],
  summary: 'Khai báo thuốc bổ dài hạn không qua đơn thuốc',
  request: {
    params: z.object({ id: z.uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: createSelfReportedCourseRequestSchema } },
    },
  },
  responses: {
    201: {
      description: 'Đợt tự khai báo đã tạo',
      content: { 'application/json': { schema: medicationCourseSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN: main cùng gia đình và CSRF'),
    404: error('ERR_NOT_FOUND'),
    409: {
      ...error('ERR_CONSENT_REQUIRED, ERR_COURSE_CONFLICT_UNRESOLVED'),
      content: {
        'application/json': { schema: z.union([errorResponseSchema, courseConflictErrorResponseSchema]) },
      },
    },
    422: error('ERR_DOSE_INFO_MISSING, ERR_VALIDATION'),
  },
});
