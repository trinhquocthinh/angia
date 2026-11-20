import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { HouseholdLeaveDependencies } from '../application/leavePorts.js';
import { leaveHousehold } from '../application/leaveHousehold.js';
import { leaveHouseholdRoute } from './leaveHouseholdRouteDefinition.js';

export function registerHouseholdLeaveRoute(app: OpenAPIHono<AppEnv>, deps: HouseholdLeaveDependencies) {
  app.openapi(leaveHouseholdRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const session = currentSession(c);
    const result = await leaveHousehold(
      deps,
      {
        accountId: session.account.id,
        familyId: session.family?.id ?? null,
        role: session.role,
      },
      c.req.valid('json'),
    );
    if (!result.ok) return c.json(...errorJson(result.code, result.details));
    return c.body(null, 204);
  });
}
