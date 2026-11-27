import { createRoute, z } from '@hono/zod-openapi';
import {
  adminAccountDetailSchema,
  adminAccountLockRequestSchema,
  errorResponseSchema,
} from '@angia/contracts';

const param = z.object({ id: z.uuid() });
const responses = {
  200: {
    description: 'Chi tiết tài khoản',
    content: { 'application/json': { schema: adminAccountDetailSchema } },
  },
  401: {
    description: 'ERR_UNAUTHENTICATED',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
  403: {
    description: 'ERR_FORBIDDEN | ERR_PASSWORD_CHANGE_REQUIRED | ERR_LEGAL_ACCEPTANCE_REQUIRED',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
  404: { description: 'ERR_NOT_FOUND', content: { 'application/json': { schema: errorResponseSchema } } },
  422: { description: 'ERR_VALIDATION', content: { 'application/json': { schema: errorResponseSchema } } },
};
const body = { required: true, content: { 'application/json': { schema: adminAccountLockRequestSchema } } };

export const getAdminAccountRoute = createRoute({
  method: 'get',
  path: '/api/admin/accounts/{id}',
  tags: ['accountLock'],
  summary: 'SystemAdmin OIDC xem chi tiết tài khoản (SPEC-075)',
  request: { params: param },
  responses,
});
export const lockAccountRoute = createRoute({
  method: 'post',
  path: '/api/admin/accounts/{id}/lock',
  tags: ['accountLock'],
  summary: 'SystemAdmin OIDC khoá tài khoản (SPEC-075)',
  request: { params: param, body },
  responses,
});
export const unlockAccountRoute = createRoute({
  method: 'post',
  path: '/api/admin/accounts/{id}/unlock',
  tags: ['accountLock'],
  summary: 'SystemAdmin OIDC mở khoá tài khoản (SPEC-075)',
  request: { params: param, body },
  responses,
});
