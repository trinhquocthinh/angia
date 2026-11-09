import { createRoute, z, type OpenAPIHono, type RouteConfig } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { errorResponseSchema } from '@angia/contracts';
import type { AppEnv } from '@src/shared/http/AppEnv.js';

const json = (schema: z.ZodType) => ({ content: { 'application/json': { schema } } });

// Chỉ khai báo OpenAPI ở đây: application kiểm input sau phạm vi và consent (SDD §3.9).
export function registerPainRoute(
  app: OpenAPIHono<AppEnv>,
  method: RouteConfig['method'],
  path: string,
  input: { body?: z.ZodType; query?: z.ZodObject },
  status: 200 | 201 | 204,
  output: z.ZodType | undefined,
  handler: (c: Context<AppEnv>) => Promise<Response>,
): void {
  const params = Object.fromEntries([...path.matchAll(/\{(\w+)\}/g)].map((m) => [m[1]!, z.uuid()]));
  const error = { description: 'Lỗi theo SDD §4', ...json(errorResponseSchema) };
  const route = createRoute({
    method,
    path,
    tags: ['pain-journal'],
    request: {
      params: z.object(params),
      ...(input.query ? { query: input.query } : {}),
      ...(input.body ? { body: { required: true, ...json(input.body) } } : {}),
    },
    responses: {
      [status]: { description: 'Thành công', ...(output ? json(output) : {}) },
      401: error,
      403: error,
      404: error,
      409: error,
      422: error,
    },
  });
  app.openAPIRegistry.registerPath(route);
  app.on(method.toUpperCase(), path.replace(/\{(\w+)\}/g, ':$1'), handler);
}
