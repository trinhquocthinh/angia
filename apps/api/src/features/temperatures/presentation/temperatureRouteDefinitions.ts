import { createRoute, z } from '@hono/zod-openapi';
import {
  errorResponseSchema,
  recordTemperatureRequestSchema,
  temperatureListSchema,
  temperatureQuerySchema,
  temperatureReadingSchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
const json = <T extends z.ZodType>(schema: T) => ({ content: { 'application/json': { schema } } });
const path = '/api/health-profiles/{id}/temperatures';
const common = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN'),
  404: error('ERR_NOT_FOUND: hồ sơ không thuộc gia đình'),
  409: error('ERR_CONSENT_REQUIRED'),
  422: error('ERR_VALIDATION'),
};
const tags = ['temperatures'];

export const recordTemperatureRoute = createRoute({
  method: 'post',
  path,
  tags,
  summary: 'Ghi nhiệt độ cơ thể (SPEC-048); ngoài 34,0–43,0 °C cần confirmOutOfRange',
  request: {
    params: z.object({ id: z.uuid() }),
    body: { required: true, ...json(recordTemperatureRequestSchema) },
  },
  responses: {
    201: { description: 'Nhiệt độ đã ghi, làm tròn tới 0,1', ...json(temperatureReadingSchema) },
    ...common,
    422: error(
      'ERR_OUT_OF_RANGE_UNCONFIRMED (details.fields = ["celsius"]); ERR_VALIDATION: ngoài 25–50 °C hoặc giờ ở tương lai',
    ),
  },
});

export const listTemperaturesRoute = createRoute({
  method: 'get',
  path,
  tags,
  summary: 'Nhiệt độ trong khoảng ngày Việt Nam (tối đa 366 ngày), cũ nhất trước',
  request: { params: z.object({ id: z.uuid() }), query: temperatureQuerySchema },
  responses: { 200: { description: 'Danh sách nhiệt độ', ...json(temperatureListSchema) }, ...common },
});

export const deleteTemperatureRoute = createRoute({
  method: 'delete',
  path: `${path}/{readingId}`,
  tags,
  summary: 'Xóa nhiệt độ ghi nhầm',
  request: { params: z.object({ id: z.uuid(), readingId: z.uuid() }) },
  responses: {
    204: { description: 'Đã xóa' },
    ...common,
    404: error('ERR_NOT_FOUND: hồ sơ hoặc bản ghi không thuộc gia đình'),
  },
});
