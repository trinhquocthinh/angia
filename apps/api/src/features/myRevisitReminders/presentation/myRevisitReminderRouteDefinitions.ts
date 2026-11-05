import { createRoute, z } from '@hono/zod-openapi';
import { errorResponseSchema, myRevisitReminderSchema } from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});

export const getMyRevisitReminderRoute = createRoute({
  method: 'get',
  path: '/api/me/revisit-reminders/{reminderId}',
  tags: ['reminders'],
  summary: 'Đọc nhắc tái khám dành cho người nhận hiện hành (SPEC-044)',
  request: { params: z.object({ reminderId: z.string() }) },
  responses: {
    200: {
      description: 'Chi tiết nhắc tái khám',
      content: { 'application/json': { schema: myRevisitReminderSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN: tài khoản chưa thuộc gia đình'),
    404: error('ERR_NOT_FOUND: không tìm thấy hoặc không còn quyền xem'),
  },
});
