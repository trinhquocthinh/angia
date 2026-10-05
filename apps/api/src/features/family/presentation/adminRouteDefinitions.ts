import { createRoute, z } from '@hono/zod-openapi';
import {
  accountSchema,
  assignMembershipRequestSchema,
  changeMembershipRequestSchema,
  createFamilyRequestSchema,
  errorResponseSchema,
  familySchema,
} from '@angia/contracts';

const json = <T extends z.ZodType>(schema: T) => ({ 'application/json': { schema } });

const error = (description: string) => ({ description, content: json(errorResponseSchema) });

// Mọi route /api/admin/* qua requireSession (401, CSRF) rồi requireAdmin (BR-006).
const guardErrors = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN: không phải Quản trị hệ thống hoặc thiếu/sai X-CSRF-Token'),
};

const accountIdParams = z.object({ id: z.uuid() });

export const listFamiliesRoute = createRoute({
  method: 'get',
  path: '/api/admin/families',
  tags: ['admin'],
  summary: 'Danh sách nhóm gia đình',
  responses: {
    200: { description: 'Mọi nhóm, cũ nhất trước', content: json(z.array(familySchema)) },
    ...guardErrors,
  },
});

export const createFamilyRoute = createRoute({
  method: 'post',
  path: '/api/admin/families',
  tags: ['admin'],
  summary: 'Khởi tạo nhóm gia đình mới (SPEC-001)',
  request: { body: { required: true, content: json(createFamilyRequestSchema) } },
  responses: {
    201: { description: 'Nhóm mới, chưa có tài khoản nào', content: json(familySchema) },
    ...guardErrors,
    422: error('ERR_VALIDATION: tên rỗng hoặc dài hơn 60 ký tự'),
  },
});

export const listAccountsRoute = createRoute({
  method: 'get',
  path: '/api/admin/accounts',
  tags: ['admin'],
  summary: 'Danh sách tài khoản kèm nhóm và vai trò, gồm tài khoản chờ gán nhóm',
  responses: {
    200: { description: 'Mọi tài khoản, cũ nhất trước', content: json(z.array(accountSchema)) },
    ...guardErrors,
  },
});

export const assignMembershipRoute = createRoute({
  method: 'post',
  path: '/api/admin/accounts/{id}/membership',
  tags: ['admin'],
  summary: 'Phân bổ tài khoản vào nhóm và vai trò (SPEC-002)',
  request: {
    params: accountIdParams,
    body: { required: true, content: json(assignMembershipRequestSchema) },
  },
  responses: {
    200: { description: 'Tài khoản sau khi gán', content: json(accountSchema) },
    ...guardErrors,
    404: error('ERR_NOT_FOUND: tài khoản hoặc nhóm không tồn tại'),
    409: error('ERR_ACCOUNT_ALREADY_IN_FAMILY | ERR_FIRST_ACCOUNT_MUST_BE_MAIN'),
    422: error('ERR_VALIDATION'),
  },
});

export const changeMembershipRoute = createRoute({
  method: 'patch',
  path: '/api/admin/accounts/{id}/membership',
  tags: ['admin'],
  summary: 'Điều chỉnh vai trò hoặc gỡ tài khoản khỏi nhóm (SPEC-003)',
  request: {
    params: accountIdParams,
    body: { required: true, content: json(changeMembershipRequestSchema) },
  },
  responses: {
    200: {
      description: 'Tài khoản sau thay đổi; gỡ khỏi nhóm thì familyId/role null (chờ gán nhóm)',
      content: json(accountSchema),
    },
    ...guardErrors,
    404: error('ERR_NOT_FOUND: tài khoản không tồn tại hoặc chưa thuộc nhóm nào'),
    409: error('ERR_LAST_MAIN'),
    422: error('ERR_VALIDATION'),
  },
});
