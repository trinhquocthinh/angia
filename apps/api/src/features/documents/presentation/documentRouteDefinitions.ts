import { createRoute, z } from '@hono/zod-openapi';
import { errorResponseSchema, uploadBatchRequestSchema, uploadBatchResponseSchema } from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});

export const uploadBatchRoute = createRoute({
  method: 'post',
  path: '/api/health-profiles/{id}/upload-batches',
  tags: ['documents'],
  summary: 'Tải lên 01 ảnh chứng từ (JPEG/PNG/HEIC/WebP ≤ 10 MiB) cho hồ sơ đã đồng thuận',
  request: {
    params: z.object({ id: z.uuid() }),
    body: { required: true, content: { 'multipart/form-data': { schema: uploadBatchRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Lô tải lên với chứng từ trạng thái uploaded',
      content: { 'application/json': { schema: uploadBatchResponseSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN: cần main cùng gia đình và CSRF'),
    404: error('ERR_NOT_FOUND: hồ sơ không thuộc gia đình'),
    409: error('ERR_CONSENT_REQUIRED'),
    422: error('ERR_VALIDATION (không đúng 1 tệp) hoặc ERR_NO_VALID_FILE'),
  },
});
