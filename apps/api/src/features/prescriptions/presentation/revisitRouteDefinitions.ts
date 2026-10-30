import { createRoute, z } from '@hono/zod-openapi';
import {
  errorResponseSchema,
  revisitListSchema,
  revisitQuerySchema,
  setRevisitDateSchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
const errors = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN'),
  404: error('ERR_NOT_FOUND'),
  409: error('ERR_CONSENT_REQUIRED'),
  422: error('ERR_VALIDATION'),
};
export const listRevisitsRoute = createRoute({
  method: 'get',
  path: '/api/health-profiles/{id}/revisits',
  tags: ['prescriptions'],
  summary: 'Đọc lịch tái khám gộp theo ngày (SPEC-043)',
  request: { params: z.object({ id: z.uuid() }), query: revisitQuerySchema },
  responses: {
    200: {
      description: 'Lịch hẹn từ from, mặc định hôm nay VN',
      content: { 'application/json': { schema: revisitListSchema } },
    },
    ...errors,
  },
});
export const setRevisitDateRoute = createRoute({
  method: 'put',
  path: '/api/health-profiles/{id}/prescriptions/{prescriptionId}/revisit-date',
  tags: ['prescriptions'],
  summary: 'Sửa hoặc xóa ngày hẹn tái khám (SPEC-043)',
  request: {
    params: z.object({ id: z.uuid(), prescriptionId: z.uuid() }),
    body: { required: true, content: { 'application/json': { schema: setRevisitDateSchema } } },
  },
  responses: {
    200: {
      description: 'Ngày hẹn đã lưu',
      content: { 'application/json': { schema: setRevisitDateSchema } },
    },
    ...errors,
  },
});
