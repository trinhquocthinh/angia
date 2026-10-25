import { createRoute, type z } from '@hono/zod-openapi';
import { aiBudgetSchema, errorResponseSchema, updateAiBudgetRequestSchema } from '@angia/contracts';

const json = <T extends z.ZodType>(schema: T) => ({ 'application/json': { schema } });
const error = (description: string) => ({ description, content: json(errorResponseSchema) });
const guardErrors = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN: không phải Quản trị hệ thống hoặc thiếu/sai X-CSRF-Token'),
};

export const getAiBudgetRoute = createRoute({
  method: 'get',
  path: '/api/admin/extraction-cap',
  tags: ['admin'],
  summary: 'Trần và chi phí AI tháng hiện tại (SPEC-013)',
  responses: {
    200: {
      description: 'Tháng ngân sách giờ Việt Nam; đã dùng gồm phần đang giữ chỗ',
      content: json(aiBudgetSchema),
    },
    ...guardErrors,
  },
});

export const setAiBudgetRoute = createRoute({
  method: 'put',
  path: '/api/admin/extraction-cap',
  tags: ['admin'],
  summary: 'Điều chỉnh trần ngân sách AI tháng hiện tại (SPEC-013)',
  request: { body: { required: true, content: json(updateAiBudgetRequestSchema) } },
  responses: {
    200: {
      description: 'Trần mới; nâng trần thì chứng từ chờ ngân sách được xử lý lại',
      content: json(aiBudgetSchema),
    },
    ...guardErrors,
    422: error('ERR_VALIDATION: ngoài 0.00 – 100.00 hoặc lẻ hơn 0.01'),
  },
});
