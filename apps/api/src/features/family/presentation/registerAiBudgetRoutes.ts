import type { OpenAPIHono } from '@hono/zod-openapi';
import { requireAdmin } from '@src/shared/auth/presentation/requireAdmin.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { AiBudgetDependencies } from '../application/aiBudgetPorts.js';
import { getAiBudget } from '../application/getAiBudget.js';
import { setAiBudget } from '../application/setAiBudget.js';
import { getAiBudgetRoute, setAiBudgetRoute } from './aiBudgetRouteDefinitions.js';

// Chỉ Quản trị hệ thống (SPEC-013, TC-042); khai báo requireAdmin riêng để không phụ thuộc thứ tự đăng ký route.
export function registerAiBudgetRoutes(app: OpenAPIHono<AppEnv>, deps: AiBudgetDependencies): void {
  app.use('/api/admin/extraction-cap', requireAdmin());

  app.openapi(getAiBudgetRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    return c.json(await getAiBudget(deps), 200);
  });

  app.openapi(setAiBudgetRoute, async (c) => c.json(await setAiBudget(deps, c.req.valid('json')), 200));
}
