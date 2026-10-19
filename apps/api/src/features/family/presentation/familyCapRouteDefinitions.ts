import { createRoute, z } from '@hono/zod-openapi';
import {
  errorResponseSchema,
  familyExtractionCapSchema,
  updateFamilyExtractionCapRequestSchema,
} from '@angia/contracts';

const json = <T extends z.ZodType>(schema: T) => ({ 'application/json': { schema } });
const error = (description: string) => ({ description, content: json(errorResponseSchema) });
const guardErrors = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN: không phải Quản trị hệ thống hoặc thiếu/sai X-CSRF-Token'),
};

export const listFamilyCapsRoute = createRoute({
  method: 'get',
  path: '/api/admin/family-extraction-caps',
  tags: ['admin'],
  summary: 'Trần và chi phí OCR tháng hiện tại của từng gia đình (SPEC-031)',
  responses: {
    200: {
      description: 'Gia đình cũ nhất trước; chi phí gồm phần đang giữ chỗ',
      content: json(z.array(familyExtractionCapSchema)),
    },
    ...guardErrors,
  },
});

export const setFamilyCapRoute = createRoute({
  method: 'put',
  path: '/api/admin/families/{id}/extraction-cap',
  tags: ['admin'],
  summary: 'Đặt trần OCR riêng của một gia đình; null = về mặc định (SPEC-031)',
  request: {
    params: z.object({ id: z.uuid() }),
    body: { required: true, content: json(updateFamilyExtractionCapRequestSchema) },
  },
  responses: {
    200: { description: 'Trần hiệu lực sau khi đặt', content: json(familyExtractionCapSchema) },
    ...guardErrors,
    404: error('ERR_NOT_FOUND'),
    422: error('ERR_VALIDATION'),
  },
});
