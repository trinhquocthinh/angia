import { createRoute, z } from '@hono/zod-openapi';
import {
  stopCourseRequestSchema,
  stoppableCoursesSchema,
  medicationCourseSchema,
  errorResponseSchema,
} from '@angia/contracts';
const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
export const listStoppableCoursesRoute = createRoute({
  method: 'get',
  path: '/api/health-profiles/{id}/medication-courses/stoppable',
  tags: ['medications'],
  summary: 'Liệt kê đợt active đã bắt đầu để ghi nhận dừng',
  request: { params: z.object({ id: z.uuid() }) },
  responses: {
    200: {
      description: 'Ngày Việt Nam và các đợt có thể ghi nhận dừng',
      content: { 'application/json': { schema: stoppableCoursesSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN'),
    404: error('ERR_NOT_FOUND'),
    409: error('ERR_CONSENT_REQUIRED'),
    422: error('ERR_VALIDATION'),
  },
});
export const stopCourseRoute = createRoute({
  method: 'post',
  path: '/api/health-profiles/{id}/medication-courses/{courseId}/stop',
  tags: ['medications'],
  summary: 'Ghi nhận dừng đợt thuốc từ một ngày trong quá khứ hoặc hôm nay',
  request: {
    params: z.object({ id: z.uuid(), courseId: z.uuid() }),
    body: { required: true, content: { 'application/json': { schema: stopCourseRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Đợt thuốc đã dừng',
      content: { 'application/json': { schema: medicationCourseSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN'),
    404: error('ERR_NOT_FOUND'),
    409: error('ERR_CONSENT_REQUIRED, ERR_INVALID_STATE_TRANSITION'),
    422: error('ERR_VALIDATION'),
  },
});
