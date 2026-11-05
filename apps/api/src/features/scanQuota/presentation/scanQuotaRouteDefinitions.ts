import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  adminScanQuotaViewSchema,
  familyScanQuotaSchema,
  grantScanQuotasRequestSchema,
  errorResponseSchema,
} from '@angia/contracts';
const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
const adminResponses = {
  200: {
    description: 'Quota đã cấp và sức chứa hiện tại; chưa áp dụng runtime OCR',
    content: { 'application/json': { schema: adminScanQuotaViewSchema } },
  },
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN'),
  404: error('ERR_NOT_FOUND'),
  409: error('ERR_SCAN_QUOTA_CONFLICT / ERR_SCAN_QUOTA_UNAVAILABLE / ERR_SCAN_QUOTA_DECREASE'),
  422: error('ERR_VALIDATION'),
};
export const getAdminScanQuotasRoute = createRoute({
  method: 'get',
  path: '/api/admin/scan-quotas',
  tags: ['admin'],
  summary: 'Đọc quota quét của tháng hiện tại',
  responses: adminResponses,
});
export const postScanQuotaGrantsRoute = createRoute({
  method: 'post',
  path: '/api/admin/scan-quota-grants',
  tags: ['admin'],
  summary: 'Duyệt tường minh tổng lượt quét theo gia đình trong tháng',
  request: {
    body: { required: true, content: { 'application/json': { schema: grantScanQuotasRequestSchema } } },
  },
  responses: adminResponses,
});
export const getFamilyScanQuotaRoute = createRoute({
  method: 'get',
  path: '/api/family/scan-quota',
  tags: ['family'],
  summary: 'Đọc lượt quét của gia đình trong phiên',
  request: { query: z.strictObject({}) },
  responses: {
    200: {
      description: 'Chỉ số lượt quét, không có tiền hoặc định danh gia đình',
      content: { 'application/json': { schema: familyScanQuotaSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN'),
    422: error('ERR_VALIDATION'),
  },
});
