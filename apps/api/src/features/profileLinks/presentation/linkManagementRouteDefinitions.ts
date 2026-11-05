import { createRoute, z } from '@hono/zod-openapi';
import {
  adminProfileLinkSchema,
  errorResponseSchema,
  setLinkedAccountRequestSchema,
  unlinkProfileRequestSchema,
} from '@angia/contracts';

const json = <T extends z.ZodType>(schema: T) => ({ 'application/json': { schema } });
const error = (description: string) => ({ description, content: json(errorResponseSchema) });
const guardErrors = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN: không phải Quản trị hệ thống hoặc thiếu/sai X-CSRF-Token'),
};
export const unlinkOwnProfileRoute = createRoute({
  method: 'post',
  path: '/api/me/profile-link/unlink',
  tags: ['profile-links'],
  summary: 'Chủ hồ sơ tự gỡ liên kết (SPEC-050)',
  request: { body: { required: true, content: json(unlinkProfileRequestSchema) } },
  responses: {
    204: { description: 'Đã gỡ, dữ liệu sức khỏe và đồng thuận giữ nguyên' },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN: thiếu CSRF'),
    404: error('ERR_NOT_FOUND: tài khoản không có hồ sơ liên kết'),
    422: error('ERR_VALIDATION'),
  },
});
export const listAdminProfilesRoute = createRoute({
  method: 'get',
  path: '/api/admin/families/{familyId}/profiles',
  tags: ['admin'],
  summary: 'Tên hồ sơ và tài khoản liên kết của một gia đình (ngoại lệ hẹp BR-003)',
  request: { params: z.object({ familyId: z.uuid() }) },
  responses: {
    200: { description: 'Chỉ id và tên', content: json(z.array(adminProfileLinkSchema)) },
    ...guardErrors,
    422: error('ERR_VALIDATION'),
  },
});
export const setLinkedAccountRoute = createRoute({
  method: 'put',
  path: '/api/admin/families/{familyId}/profiles/{profileId}/linked-account',
  tags: ['admin'],
  summary: 'Quản trị chuyển hoặc gỡ (accountId null) liên kết (SPEC-050)',
  request: {
    params: z.object({ familyId: z.uuid(), profileId: z.uuid() }),
    body: { required: true, content: json(setLinkedAccountRequestSchema) },
  },
  responses: {
    200: { description: 'Liên kết sau thay đổi', content: json(adminProfileLinkSchema) },
    ...guardErrors,
    404: error('ERR_NOT_FOUND: hồ sơ hoặc tài khoản không thuộc gia đình'),
    409: error('ERR_PROFILE_ALREADY_LINKED'),
    422: error('ERR_VALIDATION'),
  },
});
