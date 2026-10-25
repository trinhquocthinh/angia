import { createRoute, type z } from '@hono/zod-openapi';
import { errorResponseSchema, familyUsageSchema } from '@angia/contracts';

const json = <T extends z.ZodType>(schema: T) => ({ 'application/json': { schema } });
const error = (description: string) => ({ description, content: json(errorResponseSchema) });

export const familyUsageRoute = createRoute({
  method: 'get',
  path: '/api/family/usage',
  tags: ['family'],
  summary: 'Mức đã dùng / trần tài nguyên của gia đình (SPEC-030)',
  responses: {
    200: { description: 'Chỉ số của gia đình phiên', content: json(familyUsageSchema) },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN: không phải người chăm sóc chính'),
  },
});
