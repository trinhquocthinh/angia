import { createRoute } from '@hono/zod-openapi';
import {
  errorResponseSchema,
  registrationSwitchResponseSchema,
  updateRegistrationSwitchRequestSchema,
} from '@angia/contracts';

export const getRegistrationSwitchRoute = createRoute({
  method: 'get',
  path: '/api/registration-switch',
  tags: ['registrationSwitch'],
  summary: 'Đọc công khai trạng thái mở đăng ký (SPEC-074)',
  responses: {
    200: {
      description: 'Trạng thái mở đăng ký',
      content: { 'application/json': { schema: registrationSwitchResponseSchema } },
    },
  },
});

export const updateRegistrationSwitchRoute = createRoute({
  method: 'put',
  path: '/api/admin/registration-switch',
  tags: ['registrationSwitch'],
  summary: 'SystemAdmin OIDC đổi công tắc mở đăng ký (SPEC-074)',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: updateRegistrationSwitchRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Trạng thái đã lưu',
      content: { 'application/json': { schema: registrationSwitchResponseSchema } },
    },
    401: {
      description: 'ERR_UNAUTHENTICATED',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'ERR_FORBIDDEN | ERR_PASSWORD_CHANGE_REQUIRED | ERR_LEGAL_ACCEPTANCE_REQUIRED',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    422: { description: 'ERR_VALIDATION', content: { 'application/json': { schema: errorResponseSchema } } },
  },
});
