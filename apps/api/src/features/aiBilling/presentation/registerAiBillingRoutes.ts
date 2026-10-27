import type { OpenAPIHono } from '@hono/zod-openapi';
import { requireAdmin } from '@src/shared/auth/presentation/requireAdmin.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { AiBillingDependencies } from '../application/ports.js';
import { getAiBilling } from '../application/getAiBilling.js';
import { getAiBillingRoute } from './aiBillingRouteDefinition.js';

export function registerAiBillingRoutes(app: OpenAPIHono<AppEnv>, deps: AiBillingDependencies): void {
  app.use('/api/admin/ai-billing', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    await next();
  });
  app.use('/api/admin/ai-billing', requireAdmin());
  app.openapi(getAiBillingRoute, async (c) => c.json(await getAiBilling(deps), 200));
}
