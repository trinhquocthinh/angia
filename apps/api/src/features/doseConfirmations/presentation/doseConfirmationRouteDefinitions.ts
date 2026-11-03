import { createRoute, z } from '@hono/zod-openapi';
import {
  doseConfirmationRequestSchema,
  doseConfirmationSchema,
  errorResponseSchema,
  selfReminderListSchema,
  selfReminderQuerySchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
const path = '/api/reminders/{reminderId}/dose-confirmation';
const tags = ['reminders'];
const params = z.object({ reminderId: z.uuid() });
const failures = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN: tài khoản chưa thuộc gia đình hoặc thiếu CSRF'),
  404: error('ERR_NOT_FOUND: không có lời nhắc hoặc tài khoản không được phép'),
  409: error('ERR_CONSENT_REQUIRED: hồ sơ chưa đồng thuận hoặc đã rút'),
  422: error('ERR_VALIDATION: dữ liệu sai hoặc lời nhắc không thuộc hôm nay theo giờ Việt Nam'),
};

export const confirmDoseRoute = createRoute({
  method: 'post',
  path,
  tags,
  summary: 'Xác nhận "Đã dùng" cho cả buổi (SPEC-046)',
  request: {
    params,
    body: { required: true, content: { 'application/json': { schema: doseConfirmationRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Bản xác nhận; đã có thì trả bản hiện có, không ghi đè',
      content: { 'application/json': { schema: doseConfirmationSchema } },
    },
    ...failures,
  },
});
export const undoDoseConfirmationRoute = createRoute({
  method: 'delete',
  path,
  tags,
  summary: 'Hủy xác nhận "Đã dùng" trong ngày của lời nhắc (SPEC-046)',
  request: { params },
  responses: { 204: { description: 'Đã hủy; không lưu lịch sử hủy' }, ...failures },
});
export const listProfileRemindersRoute = createRoute({
  method: 'get',
  path: '/api/health-profiles/{id}/reminders',
  tags,
  summary: 'Lời nhắc của một ngày kèm xác nhận, mặc định hôm nay Việt Nam (SPEC-046)',
  request: { params: z.object({ id: z.uuid() }), query: selfReminderQuerySchema },
  responses: {
    200: {
      description: 'Lời nhắc theo giờ nhắc tăng dần',
      content: { 'application/json': { schema: selfReminderListSchema } },
    },
    ...failures,
  },
});
