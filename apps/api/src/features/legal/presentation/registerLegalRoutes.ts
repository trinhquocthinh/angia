import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { LegalRepository } from '../application/ports.js';
import { acceptLegalRoute, currentLegalRoute } from './legalRouteDefinitions.js';

export function registerLegalRoutes(app: OpenAPIHono<AppEnv>, legal: LegalRepository): void {
  app.use('/api/me/legal-acceptances', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    await next();
  });
  app.openapi(currentLegalRoute, async (c) => c.json(await legal.current(), 200));
  app.openapi(acceptLegalRoute, async (c) => {
    const result = await legal.accept(c.get('session')!.account.id, c.req.valid('json').versionIds);
    if (!result.ok) return c.json(...errorJson('ERR_LEGAL_VERSION_OUTDATED', { current: result.current }));
    return c.body(null, 204);
  });
}
