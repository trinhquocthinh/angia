import { createRoute, z } from '@hono/zod-openapi';
import {
  approveDocumentRequestSchema,
  errorResponseSchema,
  manualRecordsResponseSchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});

export const manualRecordsRoute = createRoute({
  method: 'post',
  path: '/api/health-profiles/{id}/manual-records',
  tags: ['documents'],
  summary: 'Nhập trực tiếp số đo, đơn thuốc hoặc phiếu xét nghiệm không kèm ảnh (manualWithoutSource)',
  request: {
    params: z.object({ id: z.uuid() }),
    body: { required: true, content: { 'application/json': { schema: approveDocumentRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Bản ghi lâm sàng đã lưu, gắn cờ nhập tay không kèm chứng từ gốc',
      content: { 'application/json': { schema: manualRecordsResponseSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN: cần main cùng gia đình và CSRF'),
    404: error('ERR_NOT_FOUND'),
    409: error('ERR_CONSENT_REQUIRED'),
    422: error(
      'ERR_DOCUMENT_DATE_REQUIRED, ERR_BP_INVALID, ERR_GLUCOSE_UNIT_REQUIRED, ERR_OUT_OF_RANGE_UNCONFIRMED (details.fields), ERR_DOSE_INFO_MISSING (details.invalidItemIndexes), ERR_VALIDATION',
    ),
  },
});
