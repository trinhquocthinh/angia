import type { OpenAPIHono } from '@hono/zod-openapi';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import { requireAdmin } from '@src/shared/auth/presentation/requireAdmin.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { AccountLockDependencies } from '../application/ports.js';
import { getAdminAccount } from '../application/getAdminAccount.js';
import { lockAccount } from '../application/lockAccount.js';
import { unlockAccount } from '../application/unlockAccount.js';
import { getAdminAccountRoute, lockAccountRoute, unlockAccountRoute } from './accountLockRouteDefinitions.js';

export function registerAccountLockRoutes(app: OpenAPIHono<AppEnv>, deps: AccountLockDependencies): void {
  // Đăng ký trước handler để cả GET lẫn POST đều kiểm quyền trước validation.
  app.use('/api/admin/accounts/*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    await next();
  });
  app.use('/api/admin/accounts/*', requireAdmin());
  app.openapi(getAdminAccountRoute, async (c) => {
    const result = await getAdminAccount(deps.repository, c.req.valid('param').id);
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(result.value, 200);
  });
  app.openapi(lockAccountRoute, async (c) => {
    const result = await lockAccount(
      deps.repository,
      currentSession(c).account.id,
      c.req.valid('param').id,
      c.req.valid('json').reason,
    );
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(result.value, 200);
  });
  app.openapi(unlockAccountRoute, async (c) => {
    const result = await unlockAccount(
      deps.repository,
      currentSession(c).account.id,
      c.req.valid('param').id,
    );
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(result.value, 200);
  });
}
