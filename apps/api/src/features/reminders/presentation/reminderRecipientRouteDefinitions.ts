import { createRoute, z } from '@hono/zod-openapi';
import {
  errorResponseSchema,
  reminderRecipientsSchema,
  setReminderRecipientsRequestSchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
const path = '/api/health-profiles/{id}/reminder-recipients';
const common = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN'),
  404: error('ERR_NOT_FOUND: hồ sơ không thuộc gia đình'),
  422: error('ERR_VALIDATION'),
};
const recipients = {
  description: 'Người nhận hiện hành và tài khoản main có thể chỉ định',
  content: { 'application/json': { schema: reminderRecipientsSchema } },
};

export const getReminderRecipientsRoute = createRoute({
  method: 'get',
  path,
  tags: ['reminders'],
  summary: 'Đọc người nhận nhắc thuốc của hồ sơ (SPEC-026)',
  request: { params: z.object({ id: z.uuid() }) },
  responses: {
    200: recipients,
    ...common,
    409: error('ERR_CONSENT_REQUIRED: hồ sơ chưa đồng thuận hoặc đã rút đồng thuận'),
  },
});

export const setReminderRecipientsRoute = createRoute({
  method: 'put',
  path,
  tags: ['reminders'],
  summary: 'Chỉ định người nhận nhắc cho hồ sơ không liên kết tài khoản (SPEC-026)',
  request: {
    params: z.object({ id: z.uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: setReminderRecipientsRequestSchema } },
    },
  },
  responses: {
    200: recipients,
    ...common,
    409: error('ERR_CONSENT_REQUIRED'),
    422: error(
      'ERR_VALIDATION: danh sách rỗng, tài khoản không phải main cùng gia đình, hoặc hồ sơ đã liên kết tài khoản',
    ),
  },
});
