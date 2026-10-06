import type { OpenAPIHono } from '@hono/zod-openapi';
import { requireMain } from '@src/shared/auth/presentation/requireMain.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { createProfile } from '../application/createProfile.js';
import { confirmConsent } from '../application/confirmConsent.js';
import { listProfiles } from '../application/listProfiles.js';
import { listLinkableAccounts } from '../application/listLinkableAccounts.js';
import type { Clock, ProfileRepository } from '../application/ports.js';
import {
  listProfilesRoute,
  listLinkableAccountsRoute,
  createProfileRoute,
  confirmConsentRoute,
} from './profileRouteDefinitions.js';
import { toProfileResponse } from './toProfileResponse.js';

export function registerProfileRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: ProfileRepository,
  now: Clock,
): void {
  app.use('/api/health-profiles', requireMain());
  app.use('/api/health-profiles/*', requireMain());
  app.use('/api/health-profiles*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    await next();
  });
  app.openapi(listProfilesRoute, async (c) =>
    c.json((await listProfiles(repository, c.get('session')!.family!.id)).map(toProfileResponse), 200),
  );
  app.openapi(listLinkableAccountsRoute, async (c) =>
    c.json(await listLinkableAccounts(repository, c.get('session')!.family!.id), 200),
  );
  app.openapi(createProfileRoute, async (c) => {
    const result = await createProfile(repository, c.get('session')!.family!.id, c.req.valid('json'), now);
    return result.ok ? c.json(toProfileResponse(result.value), 201) : c.json(...errorJson(result.code));
  });
  app.openapi(confirmConsentRoute, async (c) => {
    const session = c.get('session')!;
    const result = await confirmConsent(
      repository,
      session.family!.id,
      c.req.valid('param').id,
      session.account.id,
      c.req.valid('json').confirmedBy,
      now,
    );
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json({ ...result.value, profile: toProfileResponse(result.value.profile) }, 200);
  });
}
