import { createRoute, z } from '@hono/zod-openapi';
import {
  createPrivacyDraftRequestSchema,
  approvePrivacyRequestSchema,
  privacyDraftSchema,
  sourceDocumentSchema,
  errorResponseSchema,
} from '@angia/contracts';
const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
const guarded = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN'),
  404: error('ERR_NOT_FOUND'),
};
const mutating = {
  ...guarded,
  409: error('ERR_INVALID_STATE_TRANSITION, ERR_CONSENT_REQUIRED'),
  413: error('Giới hạn body 16 KiB'),
  422: error('ERR_VALIDATION'),
};
const params = z.object({ id: z.uuid() });
const document = {
  description: 'Chứng từ',
  content: { 'application/json': { schema: sourceDocumentSchema } },
};
const draft = {
  description: 'Bản nháp hiện hành',
  content: { 'application/json': { schema: privacyDraftSchema } },
};
export const createPrivacyDraftRoute = createRoute({
  method: 'post',
  path: '/api/source-documents/{id}/privacy-drafts',
  tags: ['documents'],
  summary: 'Tạo bản che/cắt để kiểm tra; chưa gọi AI',
  request: {
    params,
    body: { required: true, content: { 'application/json': { schema: createPrivacyDraftRequestSchema } } },
  },
  responses: { 202: draft, ...mutating },
});
export const getPrivacyDraftRoute = createRoute({
  method: 'get',
  path: '/api/source-documents/{id}/privacy-draft',
  tags: ['documents'],
  summary: 'Trạng thái bản ảnh kiểm tra hiện hành',
  request: { params },
  responses: { 200: draft, ...guarded },
});
export const privacyImageRoute = createRoute({
  method: 'get',
  path: '/api/source-documents/{id}/privacy-drafts/{draftId}/image',
  tags: ['documents'],
  summary: 'PNG đúng bản kiểm tra hiện hành',
  request: { params: params.extend({ draftId: z.uuid() }) },
  responses: {
    200: {
      description: 'PNG',
      content: { 'image/png': { schema: z.string().meta({ type: 'string', format: 'binary' }) } },
    },
    ...guarded,
  },
});
export const approvePrivacyRoute = createRoute({
  method: 'post',
  path: '/api/source-documents/{id}/privacy-approval',
  tags: ['documents'],
  summary: 'Main xác nhận đúng hash PNG và gửi OCR',
  request: {
    params,
    body: { required: true, content: { 'application/json': { schema: approvePrivacyRequestSchema } } },
  },
  responses: { 200: document, ...mutating },
});
export const manualEntryRoute = createRoute({
  method: 'post',
  path: '/api/source-documents/{id}/manual-entry',
  tags: ['documents'],
  summary: 'Chọn nhập tay',
  request: { params },
  responses: { 200: document, ...mutating },
});
