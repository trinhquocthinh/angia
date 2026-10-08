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
  summary: 'Tải lên 1–10 ảnh chứng từ (JPEG/PNG/HEIC/WebP ≤ 10 MiB/ảnh) cho hồ sơ đã đồng thuận',
  request: {
    params: z.object({ id: z.uuid() }),
    body: { required: true, content: { 'multipart/form-data': { schema: uploadBatchRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Lô tải lên: chứng từ hợp lệ trạng thái uploaded, tệp bị loại trong rejectedFiles',
      content: { 'application/json': { schema: uploadBatchResponseSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN: cần main cùng gia đình và CSRF'),
    404: error('ERR_NOT_FOUND: hồ sơ không thuộc gia đình'),
    408: error('ERR_UPLOAD_TIMEOUT: 30 giây không có dữ liệu hoặc body quá 5 phút'),
    409: error('ERR_CONSENT_REQUIRED'),
    413: error('ERR_BATCH_TOO_LARGE: quá 10 tệp hoặc body vượt trần'),
    422: error('ERR_VALIDATION (không có tệp, sai loại khai báo) hoặc ERR_NO_VALID_FILE'),
    503: error('ERR_UPLOAD_BUSY: đã có 3 lô đang xử lý; thử lại sau số giây trong Retry-After'),
  },
});
