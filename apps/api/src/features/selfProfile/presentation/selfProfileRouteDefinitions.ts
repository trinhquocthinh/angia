import { createRoute, type z } from '@hono/zod-openapi';
import {
  currentMedicationsSchema,
  errorResponseSchema,
  labSeriesQuerySchema,
  labSeriesResponseSchema,
  measurementSeriesQuerySchema,
  measurementSeriesSchema,
  revisitListSchema,
  selfProfileSchema,
  selfReminderListSchema,
  selfReminderQuerySchema,
  timelinePageSchema,
  timelineQuerySchema,
  asNeededDoseListSchema,
  asNeededDoseQuerySchema,
  temperatureListSchema,
  temperatureQuerySchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
const ok = <S extends z.ZodType>(description: string, schema: S) => ({
  description,
  content: { 'application/json': { schema } },
});
const access = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN: tài khoản chưa thuộc gia đình'),
  404: error('ERR_NOT_FOUND: tài khoản không liên kết hồ sơ'),
};
const gated = { ...access, 409: error('ERR_CONSENT_REQUIRED: hồ sơ chưa đồng thuận hoặc đã rút') };
const tags = ['self-profile'];

export const selfProfileRoute = createRoute({
  method: 'get',
  path: '/api/me/profile',
  tags,
  summary: 'Tóm tắt hồ sơ liên kết với tài khoản phiên (SPEC-042)',
  responses: { 200: ok('Hồ sơ và trạng thái đồng thuận', selfProfileSchema), ...access },
});
export const selfMedicationsRoute = createRoute({
  method: 'get',
  path: '/api/me/profile/medications/current',
  tags,
  summary: 'Thuốc đang dùng của hồ sơ liên kết (SPEC-042, SPEC-018)',
  responses: { 200: ok('Thuốc có hiệu lực hôm nay', currentMedicationsSchema), ...gated },
});
export const selfRemindersRoute = createRoute({
  method: 'get',
  path: '/api/me/profile/reminders',
  tags,
  summary: 'Lời nhắc của một ngày, mặc định hôm nay Việt Nam (SPEC-042)',
  request: { query: selfReminderQuerySchema },
  responses: {
    200: ok('Lời nhắc theo giờ nhắc tăng dần', selfReminderListSchema),
    ...gated,
    422: error('ERR_VALIDATION'),
  },
});
export const selfRevisitsRoute = createRoute({
  method: 'get',
  path: '/api/me/profile/revisits',
  tags,
  summary: 'Lịch hẹn từ hôm nay trở đi của hồ sơ liên kết (SPEC-042, SPEC-043)',
  responses: {
    200: ok('Lịch hẹn gộp theo ngày', revisitListSchema),
    ...gated,
    422: error('ERR_VALIDATION'),
  },
});
export const selfTimelineRoute = createRoute({
  method: 'get',
  path: '/api/me/profile/timeline',
  tags,
  summary: 'Dòng thời gian của hồ sơ liên kết (SPEC-042, SPEC-049)',
  request: { query: timelineQuerySchema },
  responses: {
    200: ok('Trang dòng thời gian', timelinePageSchema),
    ...gated,
    422: error('ERR_VALIDATION'),
  },
});
export const selfMeasurementSeriesRoute = createRoute({
  method: 'get',
  path: '/api/me/profile/measurements/series',
  tags,
  summary: 'Chuỗi số đo của hồ sơ liên kết, 404 khi không hiện số đo (SPEC-042, BR-049)',
  request: { query: measurementSeriesQuerySchema },
  responses: {
    200: ok('Điểm đo và cờ tuần', measurementSeriesSchema),
    ...gated,
    422: error('ERR_VALIDATION'),
  },
});
export const selfLabSeriesRoute = createRoute({
  method: 'get',
  path: '/api/me/profile/lab-result-series',
  tags,
  summary: 'Chuỗi xét nghiệm của hồ sơ liên kết (SPEC-042, SPEC-021)',
  request: { query: labSeriesQuerySchema },
  responses: {
    200: ok('Nhóm chỉ số', labSeriesResponseSchema),
    ...gated,
    422: error('ERR_VALIDATION'),
  },
});

export const selfTemperaturesRoute = createRoute({
  method: 'get',
  path: '/api/me/profile/temperatures',
  tags,
  summary: 'Nhiệt độ của hồ sơ liên kết, cũ nhất trước (SPEC-042, SPEC-048)',
  request: { query: temperatureQuerySchema },
  responses: {
    200: ok('Danh sách nhiệt độ', temperatureListSchema),
    ...gated,
    422: error('ERR_VALIDATION'),
  },
});

export const selfAsNeededDosesRoute = createRoute({
  method: 'get',
  path: '/api/me/profile/as-needed-doses',
  tags,
  summary: 'Liều Khi cần của hồ sơ liên kết, cũ nhất trước (SPEC-042, SPEC-047)',
  request: { query: asNeededDoseQuerySchema },
  responses: {
    200: ok('Danh sách liều', asNeededDoseListSchema),
    ...gated,
    422: error('ERR_VALIDATION'),
  },
});
