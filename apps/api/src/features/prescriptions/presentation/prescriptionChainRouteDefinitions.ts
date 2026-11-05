import { createRoute, z } from '@hono/zod-openapi';
import { errorResponseSchema, prescriptionDetailSchema, prescriptionListItemSchema } from '@angia/contracts';

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
export const listPrescriptionsRoute = createRoute({
  method: 'get',
  path: '/api/health-profiles/{id}/prescriptions',
  tags: ['prescriptions'],
  summary: 'Đọc chuỗi đơn theo ngày kê, thời điểm lưu và ID (SPEC-045)',
  request: { params: z.object({ id: z.uuid() }) },
  responses: {
    200: {
      description: 'Chuỗi đơn tăng dần',
      content: { 'application/json': { schema: z.array(prescriptionListItemSchema) } },
    },
    ...errors,
  },
});
export const getPrescriptionDetailRoute = createRoute({
  method: 'get',
  path: '/api/health-profiles/{id}/prescriptions/{prescriptionId}',
  tags: ['prescriptions'],
  summary: 'Chi tiết đơn, đơn liền kề, mọi đợt và so sánh dữ liệu (SPEC-045)',
  request: { params: z.object({ id: z.uuid(), prescriptionId: z.uuid() }) },
  responses: {
    200: {
      description: 'Chi tiết đơn không kèm nhận định',
      content: { 'application/json': { schema: prescriptionDetailSchema } },
    },
    ...errors,
  },
});
