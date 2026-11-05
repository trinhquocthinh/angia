import { createRoute, z } from '@hono/zod-openapi';
import {
  deleteDocumentRequestSchema,
  documentDeletionImpactSchema,
  errorResponseSchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
const responses = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN: cần main cùng gia đình (và CSRF với lệnh đột biến)'),
  404: error('ERR_NOT_FOUND'),
  409: error('ERR_CONSENT_REQUIRED: hồ sơ chưa đồng thuận hoặc đã rút đồng thuận'),
  422: error('ERR_VALIDATION'),
};
const idParam = z.object({ id: z.uuid() });

export const documentDeletionImpactRoute = createRoute({
  method: 'get',
  path: '/api/source-documents/{id}/deletion-impact',
  tags: ['documents'],
  summary: 'Số bản ghi sẽ mất khi xóa chứng từ (SPEC-037)',
  request: { params: idParam },
  responses: {
    200: {
      description: 'Số lượng theo loại, gồm đợt thuốc đang dùng',
      content: { 'application/json': { schema: documentDeletionImpactSchema } },
    },
    ...responses,
  },
});

export const deleteDocumentRoute = createRoute({
  method: 'delete',
  path: '/api/source-documents/{id}',
  tags: ['documents'],
  summary: 'Xóa vĩnh viễn chứng từ, ảnh và mọi bản ghi sinh ra từ nó (SPEC-037, BR-048)',
  request: {
    params: idParam,
    body: { required: true, content: { 'application/json': { schema: deleteDocumentRequestSchema } } },
  },
  responses: {
    204: { description: 'Đã xóa' },
    ...responses,
  },
});
