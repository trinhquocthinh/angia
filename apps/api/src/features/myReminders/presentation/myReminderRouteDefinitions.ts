import { createRoute, z } from '@hono/zod-openapi';
import { errorResponseSchema, myReminderSchema } from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});

// reminderId nhận mọi chuỗi: sai định dạng UUID trả 404 như ID không tồn tại, không 422.
export const getMyReminderRoute = createRoute({
  method: 'get',
  path: '/api/me/reminders/{reminderId}',
  tags: ['reminders'],
  summary: 'Đọc lời nhắc mà tài khoản phiên là người nhận hiện hành (SPEC-035)',
  request: { params: z.object({ reminderId: z.string() }) },
  responses: {
    200: {
      description: 'Lời nhắc của buổi kèm thuốc cần dùng',
      content: { 'application/json': { schema: myReminderSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN: tài khoản chưa thuộc gia đình'),
    404: error('ERR_NOT_FOUND: không có lời nhắc hoặc tài khoản không phải người nhận hợp lệ'),
  },
});
