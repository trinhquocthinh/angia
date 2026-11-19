import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { ProfileGuardianRepository } from '../application/ports.js';
import { addProfileGuardian } from '../application/addProfileGuardian.js';
import { removeOwnProfileGuardian } from '../application/removeOwnProfileGuardian.js';
import { addProfileGuardianRoute, removeOwnProfileGuardianRoute } from './profileGuardianRouteDefinitions.js';

// Đăng ký sau registerProfileRoutes để dùng requireMain và no-store hiện có.
export function registerProfileGuardianRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: ProfileGuardianRepository,
) {
  app.openapi(addProfileGuardianRoute, async (c) => {
    const s = currentSession(c);
    const result = await addProfileGuardian(
      repository,
      { accountId: s.account.id, familyId: s.family?.id ?? null, role: s.role },
      c.req.valid('param').id,
      c.req.valid('json').guardianAccountId,
    );
    return result.ok ? c.body(null, 204) : c.json(...errorJson(result.code));
  });
  app.openapi(removeOwnProfileGuardianRoute, async (c) => {
    const s = currentSession(c);
    const result = await removeOwnProfileGuardian(
      repository,
      { accountId: s.account.id, familyId: s.family?.id ?? null, role: s.role },
      c.req.valid('param').id,
    );
    return result.ok ? c.body(null, 204) : c.json(...errorJson(result.code));
  });
}
