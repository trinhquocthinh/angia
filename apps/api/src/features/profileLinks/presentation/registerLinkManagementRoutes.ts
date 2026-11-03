import type { OpenAPIHono } from '@hono/zod-openapi';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { ProfileLinkDependencies } from '../application/ports.js';
import { setLinkedAccount } from '../application/setLinkedAccount.js';
import { unlinkOwnProfile } from '../application/unlinkOwnProfile.js';
import {
  listAdminProfilesRoute,
  setLinkedAccountRoute,
  unlinkOwnProfileRoute,
} from './linkManagementRouteDefinitions.js';

// SPEC-050: main không có route gỡ/chuyển. /api/admin/* đã qua requireAdmin ở registerAdminRoutes;
// hồ sơ tự gỡ lấy từ phiên, không nhận từ client.
export function registerLinkManagementRoutes(app: OpenAPIHono<AppEnv>, deps: ProfileLinkDependencies): void {
  app.openapi(unlinkOwnProfileRoute, async (c) => {
    const { family, account } = currentSession(c);
    if (!family || !account.healthProfileId) return c.json(...errorJson('ERR_NOT_FOUND'));
    const result = await unlinkOwnProfile(deps, family.id, account.id, account.healthProfileId);
    return result.ok ? c.body(null, 204) : c.json(...errorJson(result.code));
  });
  app.openapi(listAdminProfilesRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const profiles = await deps.repository.withFamily(c.req.valid('param').familyId, (store) =>
      store.listProfileLinks(),
    );
    return c.json(profiles, 200);
  });
  app.openapi(setLinkedAccountRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const result = await setLinkedAccount(deps, {
      ...c.req.valid('param'),
      accountId: c.req.valid('json').accountId,
      actorId: currentSession(c).account.id,
    });
    return result.ok ? c.json(result.value, 200) : c.json(...errorJson(result.code));
  });
}
