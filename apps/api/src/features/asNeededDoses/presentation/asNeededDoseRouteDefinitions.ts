import { createRoute, z } from '@hono/zod-openapi';
import {
  asNeededDoseListSchema,
  asNeededDoseQuerySchema,
  asNeededDoseSchema,
  courseIntervalSchema,
  errorResponseSchema,
  recordAsNeededDoseRequestSchema,
  setCourseIntervalRequestSchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
const json = <T extends z.ZodType>(schema: T) => ({ content: { 'application/json': { schema } } });
const path = '/api/health-profiles/{id}/as-needed-doses';
const common = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN'),
  404: error('ERR_NOT_FOUND: hồ sơ không thuộc gia đình'),
  409: error('ERR_CONSENT_REQUIRED'),
  422: error('ERR_VALIDATION'),
};
const tags = ['as-needed-doses'];

export const recordAsNeededDoseRoute = createRoute({
  method: 'post',
  path,
  tags,
  summary: 'Ghi một liều "Khi cần" (SPEC-047); không tính giờ liều tiếp',
  request: {
    params: z.object({ id: z.uuid() }),
    body: { required: true, ...json(recordAsNeededDoseRequestSchema) },
  },
  responses: {
    201: { description: 'Liều đã ghi', ...json(asNeededDoseSchema) },
    ...common,
    422: error('ERR_VALIDATION: đợt không phải "Khi cần" từ đơn, hết hiệu lực, hoặc giờ ở tương lai'),
  },
});

export const listAsNeededDosesRoute = createRoute({
  method: 'get',
  path,
  tags,
  summary: 'Liều "Khi cần" trong khoảng ngày Việt Nam (tối đa 366 ngày), cũ nhất trước',
  request: { params: z.object({ id: z.uuid() }), query: asNeededDoseQuerySchema },
  responses: { 200: { description: 'Danh sách liều', ...json(asNeededDoseListSchema) }, ...common },
});

export const deleteAsNeededDoseRoute = createRoute({
  method: 'delete',
  path: `${path}/{doseId}`,
  tags,
  summary: 'Xóa liều ghi nhầm',
  request: { params: z.object({ id: z.uuid(), doseId: z.uuid() }) },
  responses: {
    204: { description: 'Đã xóa' },
    ...common,
    404: error('ERR_NOT_FOUND: hồ sơ hoặc liều không thuộc gia đình'),
  },
});

export const setCourseIntervalRoute = createRoute({
  method: 'put',
  path: '/api/health-profiles/{id}/medication-courses/{courseId}/interval',
  tags,
  summary: 'Khoảng cách tối thiểu do người dùng nhập theo nhãn thuốc; giá trị trên đơn vẫn được ưu tiên',
  request: {
    params: z.object({ id: z.uuid(), courseId: z.uuid() }),
    body: { required: true, ...json(setCourseIntervalRequestSchema) },
  },
  responses: {
    200: { description: 'Khoảng cách hiệu lực sau khi lưu', ...json(courseIntervalSchema) },
    ...common,
    422: error('ERR_VALIDATION: đợt không phải "Khi cần" từ đơn'),
  },
});
