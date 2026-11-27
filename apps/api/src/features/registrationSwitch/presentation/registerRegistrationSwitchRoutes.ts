import type { OpenAPIHono } from '@hono/zod-openapi';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import { requireAdmin } from '@src/shared/auth/presentation/requireAdmin.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { RegistrationSwitchDependencies } from '../application/ports.js';
import { setRegistrationSwitch } from '../application/setRegistrationSwitch.js';
import {
  getRegistrationSwitchRoute,
  updateRegistrationSwitchRoute,
} from './registrationSwitchRouteDefinitions.js';

export function registerRegistrationSwitchRoutes(
  app: OpenAPIHono<AppEnv>,
  deps: RegistrationSwitchDependencies,
): void {
  app.openapi(getRegistrationSwitchRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    return c.json({ registrationOpen: await deps.gate.isOpen() }, 200);
  });
  app.use(updateRegistrationSwitchRoute.path, requireAdmin());
  app.openapi(updateRegistrationSwitchRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const session = currentSession(c);
    const result = await setRegistrationSwitch(
      deps.repository,
      {
        accountId: session.account.id,
        isSystemAdmin: session.account.isSystemAdmin,
        authMethod: session.authMethod,
      },
      c.req.valid('json').open,
    );
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(result.value, 200);
  });
}
