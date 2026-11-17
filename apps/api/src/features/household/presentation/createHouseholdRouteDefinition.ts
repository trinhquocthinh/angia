import { createRoute } from '@hono/zod-openapi';
import { createHouseholdRequestSchema, errorResponseSchema, familySchema } from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});

export const createHouseholdRoute = createRoute({
  method: 'post',
  path: '/api/families',
  tags: ['household'],
  summary: 'Tạo nhà và trở thành Chủ hộ (SPEC-064)',
  request: {
    body: { required: true, content: { 'application/json': { schema: createHouseholdRequestSchema } } },
  },
  responses: {
    201: { description: 'Nhà mới', content: { 'application/json': { schema: familySchema } } },
    401: error('ERR_UNAUTHENTICATED'),
    403: error(
      'ERR_FORBIDDEN | ERR_PASSWORD_CHANGE_REQUIRED | ERR_REGISTRATION_CLOSED | ERR_LEGAL_ACCEPTANCE_REQUIRED',
    ),
    404: error('ERR_NOT_FOUND'),
    409: error('ERR_ACCOUNT_ALREADY_IN_FAMILY'),
    422: error('ERR_VALIDATION'),
  },
});
