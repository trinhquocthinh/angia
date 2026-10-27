import type { OpenAPIHono } from '@hono/zod-openapi';
import { requireAdmin } from '@src/shared/auth/presentation/requireAdmin.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { getAiRoutingSettings } from '../application/getAiRoutingSettings.js';
import { setAiRoutingSettings } from '../application/setAiRoutingSettings.js';
import type { AiRoutingDependencies } from '../application/ports.js';
import { getAiRoutingRoute, updateAiRoutingRoute } from './aiRoutingRouteDefinitions.js';

export function registerAiRoutingRoutes(app: OpenAPIHono<AppEnv>, deps: AiRoutingDependencies): void {
  app.use('/api/admin/ai-routing', requireAdmin());
  app.use('/api/admin/ai-routing', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    await next();
  });
  app.openapi(getAiRoutingRoute, async (c) => c.json(await getAiRoutingSettings(deps.repository), 200));
  app.openapi(updateAiRoutingRoute, async (c) => {
    const actorId = c.get('session')!.account.id;
    const outcome = await setAiRoutingSettings(deps, c.req.valid('json'), actorId);
    return outcome.ok ? c.json(outcome.view, 200) : c.json(...errorJson(outcome.code));
  });
}
