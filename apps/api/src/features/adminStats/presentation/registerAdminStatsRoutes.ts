import type { OpenAPIHono } from '@hono/zod-openapi';
import { requireAdmin } from '@src/shared/auth/presentation/requireAdmin.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { AdminStatsDependencies } from '../application/ports.js';
import { getAdminStats } from '../application/getAdminStats.js';
import { getAdminStatsRoute } from './adminStatsRouteDefinitions.js';

export function registerAdminStatsRoutes(app: OpenAPIHono<AppEnv>, deps: AdminStatsDependencies): void {
  app.use('/api/admin/stats*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    await next();
  });
  app.use('/api/admin/stats*', requireAdmin());
  app.openapi(getAdminStatsRoute, async (c) => {
    return c.json(await getAdminStats(deps.repository, c.req.valid('query').weeks), 200);
  });
}
