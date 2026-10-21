import { createRoute } from '@hono/zod-openapi';
import { errorResponseSchema, pushConfigSchema, pushSubscriptionSchema } from '@angia/contracts';
const errors = Object.fromEntries(
  [401, 403, 404, 409, 422, 429, 503].map((status) => [
    status,
    {
      description: 'Lỗi đăng ký/quyền/giới hạn hoặc dịch vụ push',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  ]),
);
const tags = ['push'];
const empty = { description: 'Thao tác thành công' };
export const pushConfigRoute = createRoute({
  method: 'get',
  path: '/api/me/push-config',
  tags,
  responses: {
    ...errors,
    200: {
      description: 'Cấu hình của phiên hiện hành',
      content: { 'application/json': { schema: pushConfigSchema } },
    },
  },
});
export const pushRegisterRoute = createRoute({
  method: 'put',
  path: '/api/me/push-subscription',
  tags,
  request: { body: { required: true, content: { 'application/json': { schema: pushSubscriptionSchema } } } },
  responses: { ...errors, 204: empty },
});
export const pushDeleteRoute = createRoute({
  method: 'delete',
  path: '/api/me/push-subscription',
  tags,
  responses: { ...errors, 204: empty },
});
export const pushTestRoute = createRoute({
  method: 'post',
  path: '/api/me/push-test',
  tags,
  responses: { ...errors, 204: empty },
});
