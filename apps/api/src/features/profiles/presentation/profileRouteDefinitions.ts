import { createRoute, z } from '@hono/zod-openapi';
import {
  confirmConsentRequestSchema,
  createHealthProfileRequestSchema,
  errorResponseSchema,
  healthProfileSchema,
  linkableAccountSchema,
} from '@angia/contracts';

const json = <T extends z.ZodType>(schema: T) => ({ 'application/json': { schema } });
const error = (description: string) => ({ description, content: json(errorResponseSchema) });
const guards = {
  401: error('ERR_UNAUTHENTICATED'),
  403: error('ERR_FORBIDDEN: cần main cùng gia đình và CSRF cho request ghi'),
};
const base = '/api/health-profiles';

export const listProfilesRoute = createRoute({
  method: 'get',
  path: base,
  tags: ['profiles'],
  summary: 'Hồ sơ của gia đình hiện tại',
  responses: {
    200: { description: 'Hồ sơ, cũ nhất trước', content: json(z.array(healthProfileSchema)) },
    ...guards,
  },
});
export const listLinkableAccountsRoute = createRoute({
  method: 'get',
  path: `${base}/linkable-accounts`,
  tags: ['profiles'],
  summary: 'Tài khoản cùng gia đình chưa liên kết hồ sơ',
  responses: {
    200: { description: 'Tài khoản có thể liên kết', content: json(z.array(linkableAccountSchema)) },
    ...guards,
  },
});
export const createProfileRoute = createRoute({
  method: 'post',
  path: base,
  tags: ['profiles'],
  summary: 'Tạo hồ sơ chưa xác nhận đồng thuận',
  request: { body: { required: true, content: json(createHealthProfileRequestSchema) } },
  responses: {
    201: { description: 'Hồ sơ đã tạo', content: json(healthProfileSchema) },
    ...guards,
    404: error('ERR_NOT_FOUND: tài khoản không thuộc nhóm'),
    409: error('ERR_PROFILE_ALREADY_LINKED'),
    422: error('ERR_VALIDATION: tên/năm sinh/tài khoản không hợp lệ'),
  },
});
export const confirmConsentRoute = createRoute({
  method: 'post',
  path: `${base}/{id}/consent`,
  tags: ['profiles'],
  summary: 'Route cũ: yêu cầu tạo link mời, không ghi đồng thuận',
  request: {
    params: z.object({ id: z.uuid() }),
    body: { required: true, content: json(confirmConsentRequestSchema) },
  },
  responses: {
    409: error('ERR_CONSENT_INVITATION_REQUIRED'),
    ...guards,
    404: error('ERR_NOT_FOUND'),
    422: error('ERR_VALIDATION'),
  },
});
