import { createRoute } from '@hono/zod-openapi';
import { aiRoutingViewSchema, errorResponseSchema, updateAiRoutingRequestSchema } from '@angia/contracts';

const errors = {
  401: {
    description: 'ERR_UNAUTHENTICATED',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
  403: {
    description: 'ERR_FORBIDDEN: cần SystemAdmin và CSRF hợp lệ với PUT',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
};
export const getAiRoutingRoute = createRoute({
  method: 'get',
  path: '/api/admin/ai-routing',
  tags: ['admin'],
  summary: 'Đọc cấu hình mong muốn của nhà cung cấp OCR, không trả key',
  responses: {
    200: {
      description: 'Cấu hình và phiên bản, chưa khẳng định worker đã áp dụng',
      content: { 'application/json': { schema: aiRoutingViewSchema } },
    },
    ...errors,
  },
});
export const updateAiRoutingRoute = createRoute({
  method: 'put',
  path: '/api/admin/ai-routing',
  tags: ['admin'],
  summary: 'Lưu cấu hình OCR và audit khi expectedVersion khớp',
  request: {
    body: { required: true, content: { 'application/json': { schema: updateAiRoutingRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Cấu hình đã lưu, version tăng một',
      content: { 'application/json': { schema: aiRoutingViewSchema } },
    },
    ...errors,
    409: {
      description: 'ERR_AI_ROUTING_CONFLICT',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    422: { description: 'ERR_VALIDATION', content: { 'application/json': { schema: errorResponseSchema } } },
  },
});
