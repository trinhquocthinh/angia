import { createRoute } from '@hono/zod-openapi';
import {
  errorResponseSchema,
  familyDeletionRequestSchema,
  familyDeletionRevokeSchema,
  familyDeletionResponseSchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
const errors = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN | ERR_PASSWORD_CHANGE_REQUIRED | ERR_LEGAL_ACCEPTANCE_REQUIRED'),
  404: error('ERR_NOT_FOUND'),
  409: error('ERR_FAMILY_NOT_EMPTY | ERR_RECENT_REMOVAL | ERR_DELETION_PENDING'),
  422: error('ERR_VALIDATION'),
};
export const requestHouseholdDeletionRoute = createRoute({
  method: 'post',
  path: '/api/family/deletion-request',
  tags: ['household'],
  summary: 'Yêu cầu xoá nhà, chờ 24 giờ (SPEC-069)',
  request: {
    body: { required: true, content: { 'application/json': { schema: familyDeletionRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Yêu cầu đang chờ đến hạn',
      content: { 'application/json': { schema: familyDeletionResponseSchema } },
    },
    ...errors,
  },
});
export const revokeHouseholdDeletionRoute = createRoute({
  method: 'delete',
  path: '/api/family/deletion-request',
  tags: ['household'],
  summary: 'Thu hồi yêu cầu xoá nhà trước hạn (SPEC-069)',
  request: {
    body: { required: true, content: { 'application/json': { schema: familyDeletionRevokeSchema } } },
  },
  responses: {
    204: { description: 'Đã thu hồi yêu cầu' },
    401: errors[401],
    403: errors[403],
    404: errors[404],
    422: errors[422],
  },
});

export const currentHouseholdDeletionRequestRoute = createRoute({
  method: 'get',
  path: '/api/family/deletion-request/current',
  tags: ['household'],
  summary: 'Đọc yêu cầu xoá nhà đang chờ',
  responses: {
    200: {
      description: 'Dữ liệu đang chờ',
      content: { 'application/json': { schema: familyDeletionResponseSchema } },
    },
    401: errors[401],
    403: errors[403],
    404: errors[404],
  },
});
