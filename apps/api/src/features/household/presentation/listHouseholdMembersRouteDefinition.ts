import { createRoute } from '@hono/zod-openapi';
import { errorResponseSchema, householdMembersSchema } from '@angia/contracts';

export const listHouseholdMembersRoute = createRoute({
  method: 'get',
  path: '/api/family/members',
  tags: ['household'],
  summary: 'Danh sách tài khoản trong nhà của phiên hiện tại',
  responses: {
    200: {
      description: 'Chủ hộ trước, rồi main, member; trong nhóm theo tên và UUID',
      headers: { 'Cache-Control': { schema: { type: 'string', enum: ['no-store'] } } },
      content: { 'application/json': { schema: householdMembersSchema } },
    },
    401: {
      description: 'ERR_UNAUTHENTICATED',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'ERR_FORBIDDEN',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});
