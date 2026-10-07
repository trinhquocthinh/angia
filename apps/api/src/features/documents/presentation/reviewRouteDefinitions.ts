import { createRoute, z } from '@hono/zod-openapi';
import {
  approveDocumentRequestSchema,
  approvedDocumentResponseSchema,
  documentReviewResponseSchema,
  errorResponseSchema,
  sourceDocumentSchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
const guarded = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN: cần main cùng gia đình (và CSRF với lệnh đột biến)'),
};
const idParam = z.object({ id: z.uuid() });

export const listDocumentsRoute = createRoute({
  method: 'get',
  path: '/api/source-documents',
  tags: ['documents'],
  summary: 'Danh sách chứng từ của gia đình theo bộ lọc, mới nhất trước',
  request: {
    query: z.object({
      // Lặp tham số để lọc nhiều trạng thái: ?status=uploaded&status=extracting&status=pending_review
      status: z
        .union([sourceDocumentSchema.shape.status, z.array(sourceDocumentSchema.shape.status)])
        .optional(),
      profileId: z.uuid().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Chứng từ',
      content: { 'application/json': { schema: z.array(sourceDocumentSchema) } },
    },
    ...guarded,
  },
});

export const documentReviewRoute = createRoute({
  method: 'get',
  path: '/api/source-documents/{id}/review',
  tags: ['documents'],
  summary: 'Chứng từ kèm bản trích xuất mới nhất để điền form đối soát',
  request: { params: idParam },
  responses: {
    200: {
      description: 'Dữ liệu duyệt',
      content: { 'application/json': { schema: documentReviewResponseSchema } },
    },
    ...guarded,
    404: error('ERR_NOT_FOUND'),
  },
});

export const documentImageRoute = createRoute({
  method: 'get',
  path: '/api/source-documents/{id}/image',
  tags: ['documents'],
  summary: 'Luồng ảnh chứng từ (preview chưa có thì trả ảnh gốc)',
  request: {
    params: idParam,
    query: z.object({ variant: z.enum(['preview', 'original']).default('original') }),
  },
  responses: {
    200: {
      description: 'Ảnh',
      content: { 'image/*': { schema: z.string().meta({ type: 'string', format: 'binary' }) } },
    },
    ...guarded,
    404: error('ERR_NOT_FOUND'),
  },
});

export const approveDocumentRoute = createRoute({
  method: 'post',
  path: '/api/source-documents/{id}/approve',
  tags: ['documents'],
  summary: 'Phê duyệt bản trích xuất số đo máy (E2-S6-T1: chỉ device_reading)',
  request: {
    params: idParam,
    body: { required: true, content: { 'application/json': { schema: approveDocumentRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Chứng từ approved và số đo đã lưu',
      content: { 'application/json': { schema: approvedDocumentResponseSchema } },
    },
    ...guarded,
    404: error('ERR_NOT_FOUND'),
    409: error('ERR_INVALID_STATE_TRANSITION'),
    422: error(
      'ERR_DOCUMENT_DATE_REQUIRED, ERR_BP_INVALID, ERR_GLUCOSE_UNIT_REQUIRED, ERR_OUT_OF_RANGE_UNCONFIRMED (details.fields), ERR_VALIDATION',
    ),
  },
});
