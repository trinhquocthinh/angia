import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';

export function requireTrustedJson(app: OpenAPIHono<AppEnv>, path: string, appBaseUrl: string): void {
  const origin = new URL(appBaseUrl).origin;
  // Trước validator: body sai không bỏ qua kiểm Origin/JSON, không tiêu lượt.
  app.use(path, async (c, next) => {
    c.header('Cache-Control', 'no-store');
    const mediaType = c.req.header('Content-Type')?.split(';')[0]?.trim().toLowerCase();
    if (c.req.header('Origin') !== origin || mediaType !== 'application/json') {
      return errorResponse(c, 'ERR_FORBIDDEN');
    }
    await next();
  });
}
