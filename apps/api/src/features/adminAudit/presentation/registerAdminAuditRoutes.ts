import type { OpenAPIHono } from '@hono/zod-openapi';
import { requireAdmin } from '@src/shared/auth/presentation/requireAdmin.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { AdminAuditDependencies } from '../application/ports.js';
import { listAdminAuditEvents } from '../application/listAdminAuditEvents.js';
import { listAdminAuditEventsRoute } from './adminAuditRouteDefinitions.js';

export function registerAdminAuditRoutes(app: OpenAPIHono<AppEnv>, deps: AdminAuditDependencies): void {
  app.use('/api/admin/audit-events*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    await next();
  });
  app.use('/api/admin/audit-events*', requireAdmin());
  app.openapi(listAdminAuditEventsRoute, async (c) => {
    const result = await listAdminAuditEvents(deps.repository, c.req.valid('query'));
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(result.value, 200);
  });
}
