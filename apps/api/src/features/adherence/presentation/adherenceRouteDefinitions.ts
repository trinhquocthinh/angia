import { createRoute, z } from '@hono/zod-openapi';
import {
  adherencePeriodListSchema,
  adherencePeriodSchema,
  errorResponseSchema,
  recordAdherencePeriodRequestSchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
const path = '/api/health-profiles/{id}/adherence-periods';
const common = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN'),
  404: error('ERR_NOT_FOUND: hồ sơ không thuộc gia đình'),
  409: error('ERR_CONSENT_REQUIRED'),
  422: error('ERR_VALIDATION'),
};

export const listAdherencePeriodsRoute = createRoute({
  method: 'get',
  path,
  tags: ['adherence'],
  summary: 'Liệt kê giai đoạn dùng thuốc thực tế của hồ sơ',
  request: { params: z.object({ id: z.uuid() }) },
  responses: {
    200: {
      description: 'Ngày Việt Nam và các giai đoạn theo tên thuốc chuẩn hóa, mốc tăng dần',
      content: { 'application/json': { schema: adherencePeriodListSchema } },
    },
    ...common,
  },
});

export const recordAdherencePeriodRoute = createRoute({
  method: 'post',
  path,
  tags: ['adherence'],
  summary: 'Ghi nhận giai đoạn dùng/ngưng thuốc thực tế (SPEC-022), tự đóng giai đoạn đang mở',
  request: {
    params: z.object({ id: z.uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: recordAdherencePeriodRequestSchema } },
    },
  },
  responses: {
    201: {
      description: 'Giai đoạn mới đang mở',
      content: { 'application/json': { schema: adherencePeriodSchema } },
    },
    ...common,
    422: error('ERR_VALIDATION: mốc không sau giai đoạn trước, ở tương lai hoặc trùng trạng thái'),
  },
});
