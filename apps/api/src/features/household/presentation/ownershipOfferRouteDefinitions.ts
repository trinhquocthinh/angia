import { createRoute, z } from '@hono/zod-openapi';
import {
  errorResponseSchema,
  ownershipOfferRequestSchema,
  ownershipDecisionRequestSchema,
  ownershipOfferResponseSchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
const errors = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN | ERR_PASSWORD_CHANGE_REQUIRED | ERR_LEGAL_ACCEPTANCE_REQUIRED'),
  404: error('ERR_NOT_FOUND'),
  409: error('ERR_OWNERSHIP_TRANSFER_PENDING'),
  422: error('ERR_VALIDATION'),
};
const params = z.object({ id: z.uuid() });
export const offerHouseholdOwnershipRoute = createRoute({
  method: 'post',
  path: '/api/family/ownership-offers',
  tags: ['household'],
  summary: 'Đề nghị trao quyền Chủ hộ (SPEC-068)',
  request: {
    body: { required: true, content: { 'application/json': { schema: ownershipOfferRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Đề nghị đang chờ trả lời',
      content: { 'application/json': { schema: ownershipOfferResponseSchema } },
    },
    ...errors,
  },
});
export const decideHouseholdOwnershipRoute = createRoute({
  method: 'post',
  path: '/api/family/ownership-offers/{id}/decision',
  tags: ['household'],
  summary: 'Chấp nhận hoặc từ chối trao quyền Chủ hộ (SPEC-068)',
  request: {
    params,
    body: { required: true, content: { 'application/json': { schema: ownershipDecisionRequestSchema } } },
  },
  responses: { 204: { description: 'Đã trả lời đề nghị' }, ...errors },
});
export const revokeHouseholdOwnershipRoute = createRoute({
  method: 'delete',
  path: '/api/family/ownership-offers/{id}',
  tags: ['household'],
  summary: 'Thu hồi đề nghị trao quyền Chủ hộ (SPEC-068)',
  request: { params },
  responses: { 204: { description: 'Đã thu hồi đề nghị' }, ...errors },
});
