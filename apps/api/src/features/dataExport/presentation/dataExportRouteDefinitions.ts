import { createRoute, z } from '@hono/zod-openapi';
import { errorResponseSchema } from '@angia/contracts';

const errors = {
  401: { description: 'Cần đăng nhập', content: { 'application/json': { schema: errorResponseSchema } } },
  403: {
    description: 'CSRF hoặc mật khẩu chưa đổi',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
  404: { description: 'ERR_NOT_FOUND', content: { 'application/json': { schema: errorResponseSchema } } },
  422: { description: 'ERR_VALIDATION', content: { 'application/json': { schema: errorResponseSchema } } },
};
const requestBody = z.strictObject({
  scope: z.union([z.literal('self'), z.strictObject({ profileId: z.uuid() })]),
});
const params = z.object({ id: z.uuid() });
export const requestDataExportRoute = createRoute({
  method: 'post',
  path: '/api/me/data-exports',
  tags: ['data-export'],
  summary: 'Yêu cầu tải dữ liệu (SPEC-072)',
  request: { body: { required: true, content: { 'application/json': { schema: requestBody } } } },
  responses: {
    ...errors,
    202: {
      description: 'Đã xếp việc tạo ZIP',
      content: { 'application/json': { schema: z.object({ exportId: z.uuid() }) } },
    },
    429: {
      description: 'ERR_RATE_LIMITED: tối đa 3 yêu cầu/ngày',
      content: { 'application/json': { schema: errorResponseSchema } },
      headers: { 'Retry-After': { schema: { type: 'integer' as const, minimum: 1 } } },
    },
  },
});
export const dataExportStatusRoute = createRoute({
  method: 'get',
  path: '/api/me/data-exports/{id}',
  tags: ['data-export'],
  summary: 'Xem trạng thái yêu cầu tải dữ liệu',
  request: { params },
  responses: {
    ...errors,
    200: {
      description: 'Trạng thái hiện tại',
      content: {
        'application/json': {
          schema: z.object({
            status: z.enum(['pending', 'ready', 'failed']),
            expiresAt: z.iso.datetime().nullable(),
          }),
        },
      },
    },
  },
});
export const dataExportFileRoute = createRoute({
  method: 'get',
  path: '/api/me/data-exports/{id}/file',
  tags: ['data-export'],
  summary: 'Tải ZIP của chính tài khoản trong 24 giờ',
  request: { params },
  responses: {
    ...errors,
    200: {
      description: 'Tệp dữ liệu ZIP',
      content: {
        'application/zip': { schema: { type: 'string' as const, format: 'binary' } },
      },
      headers: {
        'Cache-Control': { schema: { type: 'string' as const, const: 'no-store' } },
        'Content-Disposition': { schema: { type: 'string' as const } },
      },
    },
  },
});
