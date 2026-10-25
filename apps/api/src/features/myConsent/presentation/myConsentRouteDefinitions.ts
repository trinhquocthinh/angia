import { createRoute, z } from '@hono/zod-openapi';
import { errorResponseSchema, myConsentSchema, myConsentWithdrawnSchema } from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});

export const getMyConsentRoute = createRoute({
  method: 'get',
  path: '/api/me/consent',
  tags: ['consent'],
  summary: 'Đọc trạng thái đồng thuận của hồ sơ gắn với tài khoản phiên (SPEC-036)',
  responses: {
    200: {
      description: 'Hồ sơ liên kết (null khi tài khoản không liên kết hồ sơ)',
      content: { 'application/json': { schema: myConsentSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN: tài khoản chưa thuộc gia đình'),
  },
});

export const withdrawMyConsentRoute = createRoute({
  method: 'post',
  path: '/api/me/consent/withdraw',
  tags: ['consent'],
  summary: 'Rút đồng thuận của hồ sơ gắn với tài khoản phiên (SPEC-036)',
  request: {
    body: { required: true, content: { 'application/json': { schema: z.object({}).strict() } } },
  },
  responses: {
    200: {
      description: 'Đã rút đồng thuận',
      content: { 'application/json': { schema: myConsentWithdrawnSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN: thiếu CSRF hoặc tài khoản chưa thuộc gia đình'),
    404: error('ERR_NOT_FOUND: tài khoản không liên kết hồ sơ'),
    409: error('ERR_CONSENT_NOT_CONFIRMED: hồ sơ chưa ở trạng thái đã đồng thuận'),
  },
});
