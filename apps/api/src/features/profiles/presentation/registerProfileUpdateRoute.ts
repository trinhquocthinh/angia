import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { Clock, ProfileRepository } from '../application/ports.js';
import { updateProfile } from '../application/updateProfile.js';
import { updateProfileRoute } from './profileRouteDefinitions.js';
import { toProfileResponse } from './toProfileResponse.js';

export function registerProfileUpdateRoute(
  app: OpenAPIHono<AppEnv>,
  repository: ProfileRepository,
  now: Clock,
) {
  app.openapi(updateProfileRoute, async (c) => {
    const s = c.get('session')!;
    const result = await updateProfile(
      repository,
      s.family!.id,
      c.req.valid('param').id,
      c.req.valid('json'),
      now,
      s.account.id,
    );
    return result.ok ? c.json(toProfileResponse(result.value), 200) : c.json(...errorJson(result.code));
  });
}
