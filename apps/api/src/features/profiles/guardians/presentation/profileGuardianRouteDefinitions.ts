import { createRoute, z } from '@hono/zod-openapi';
import { errorResponseSchema, addProfileGuardianRequestSchema } from '@angia/contracts';
const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
const responses = {
  204: { description: 'Đã cập nhật người giám hộ' },
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN'),
  404: error('ERR_NOT_FOUND'),
  409: error('ERR_LAST_GUARDIAN'),
  422: error('ERR_VALIDATION'),
};
const params = z.object({ id: z.uuid() });
export const addProfileGuardianRoute = createRoute({
  method: 'post',
  path: '/api/health-profiles/{id}/guardians',
  tags: ['profiles'],
  summary: 'Thêm người giám hộ thứ hai (SPEC-070)',
  request: {
    params,
    body: { required: true, content: { 'application/json': { schema: addProfileGuardianRequestSchema } } },
  },
  responses,
});
export const removeOwnProfileGuardianRoute = createRoute({
  method: 'delete',
  path: '/api/health-profiles/{id}/guardians/me',
  tags: ['profiles'],
  summary: 'Tự gỡ tư cách giám hộ (SPEC-070)',
  request: { params },
  responses,
});
