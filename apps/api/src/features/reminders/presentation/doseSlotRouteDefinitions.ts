import { createRoute, z } from '@hono/zod-openapi';
import { doseSlotListSchema, errorResponseSchema, setDoseSlotsRequestSchema } from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
const path = '/api/health-profiles/{id}/dose-slots';
const common = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN'),
  404: error('ERR_NOT_FOUND: hồ sơ không thuộc gia đình'),
  422: error('ERR_VALIDATION'),
};
const slots = {
  description: 'Khung giờ đã lưu theo thứ tự Sáng → Tối; rỗng khi chưa thiết lập',
  content: { 'application/json': { schema: doseSlotListSchema } },
};

export const getDoseSlotsRoute = createRoute({
  method: 'get',
  path,
  tags: ['reminders'],
  summary: 'Đọc khung giờ buổi của hồ sơ (SPEC-025)',
  request: { params: z.object({ id: z.uuid() }) },
  responses: {
    200: slots,
    ...common,
    409: error('ERR_CONSENT_REQUIRED: hồ sơ chưa đồng thuận hoặc đã rút đồng thuận'),
  },
});

export const setDoseSlotsRoute = createRoute({
  method: 'put',
  path,
  tags: ['reminders'],
  summary: 'Thiết lập khung giờ buổi (SPEC-025); buổi không gửi bị bỏ khung giờ',
  request: {
    params: z.object({ id: z.uuid() }),
    body: { required: true, content: { 'application/json': { schema: setDoseSlotsRequestSchema } } },
  },
  responses: {
    200: slots,
    ...common,
    409: error('ERR_CONSENT_REQUIRED'),
    422: error('ERR_VALIDATION: sai định dạng giờ hoặc các buổi không tăng dần Sáng < Trưa < Chiều < Tối'),
  },
});
