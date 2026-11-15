import { createRoute, z } from '@hono/zod-openapi';
import { errorResponseSchema } from '@angia/contracts';

const document = z.object({
  id: z.uuid(),
  kind: z.enum(['terms', 'privacy']),
  version: z.string(),
  publishedAt: z.iso.datetime(),
  material: z.boolean(),
  url: z.string(),
});
const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});
export const currentLegalRoute = createRoute({
  method: 'get',
  path: '/api/legal/current',
  tags: ['legal'],
  summary: 'Văn bản pháp lý hiện hành (SPEC-061)',
  responses: {
    200: {
      description: 'Hai văn bản đã phát hành mới nhất',
      content: { 'application/json': { schema: z.object({ terms: document, privacy: document }) } },
    },
    500: error('ERR_INTERNAL: chưa có đủ văn bản'),
  },
});
export const acceptLegalRoute = createRoute({
  method: 'post',
  path: '/api/me/legal-acceptances',
  tags: ['legal'],
  summary: 'Đồng ý văn bản hiện hành (SPEC-061)',
  description:
    'Cần phiên và X-CSRF-Token. Cache-Control: no-store. Chỉ ghi đồng ý của chính tài khoản phiên.',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: z.object({
            versionIds: z
              .array(z.uuid())
              .min(1)
              .max(2)
              .refine((ids) => new Set(ids).size === ids.length),
          }),
        },
      },
    },
  },
  responses: {
    204: { description: 'Đã ghi nhận đồng ý, không sửa lịch sử' },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN; ERR_PASSWORD_CHANGE_REQUIRED'),
    409: error('ERR_LEGAL_VERSION_OUTDATED kèm details.current như đăng ký'),
    422: error('ERR_VALIDATION'),
    500: error('ERR_INTERNAL'),
  },
});
