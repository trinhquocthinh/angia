import type { OpenAPIHono } from '@hono/zod-openapi';
import { requireMain } from '@src/shared/auth/presentation/requireMain.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { confirmProfileConsent } from '../application/confirmProfileConsent.js';
import { consentAttestationRoute } from './consentAttestationRoute.js';
import { createProfile } from '../application/createProfile.js';
import { deleteProfile } from '../application/deleteProfile.js';
import { listProfiles } from '../application/listProfiles.js';
import { listLinkableAccounts } from '../application/listLinkableAccounts.js';
import type { Clock, ProfileDeletionDeps } from '../application/ports.js';
import {
  listProfilesRoute,
  listLinkableAccountsRoute,
  createProfileRoute,
  confirmConsentRoute,
  deleteProfileRoute,
} from './profileRouteDefinitions.js';
import { toProfileListItem } from './toProfileListItem.js';
import { toProfileResponse } from './toProfileResponse.js';

export function registerProfileRoutes(app: OpenAPIHono<AppEnv>, deps: ProfileDeletionDeps, now: Clock): void {
  const { repository } = deps;
  app.use('/api/health-profiles', requireMain());
  app.use('/api/health-profiles/*', requireMain());
  app.use('/api/health-profiles*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    await next();
  });
  app.openapi(listProfilesRoute, async (c) =>
    c.json(
      (await listProfiles(repository, c.get('session')!.family!.id, c.get('session')!.account.id)).map(
        toProfileListItem,
      ),
      200,
    ),
  );
  app.openapi(listLinkableAccountsRoute, async (c) =>
    c.json(await listLinkableAccounts(repository, c.get('session')!.family!.id), 200),
  );
  app.openapi(createProfileRoute, async (c) => {
    const result = await createProfile(
      repository,
      c.get('session')!.family!.id,
      c.req.valid('json'),
      now,
      c.get('session')!.account.id,
    );
    return result.ok ? c.json(toProfileResponse(result.value), 201) : c.json(...errorJson(result.code));
  });
  app.openapi(consentAttestationRoute, async (c) => {
    const session = c.get('session')!;
    const result = await confirmProfileConsent(
      repository,
      session.family!.id,
      session.account.id,
      c.req.valid('param').id,
      c.req.valid('json'),
      now,
    );
    return result.ok ? c.json(toProfileResponse(result.value), 200) : c.json(...errorJson(result.code));
  });
  app.openapi(confirmConsentRoute, async (c) => {
    return c.json(...errorJson('ERR_CONSENT_INVITATION_REQUIRED'));
  });
  app.openapi(deleteProfileRoute, async (c) => {
    const familyId = c.get('session')!.family!.id;
    const { id } = c.req.valid('param');
    const result = await deleteProfile(deps, familyId, id, c.req.valid('json').confirmName);
    return result.ok ? c.body(null, 204) : c.json(...errorJson(result.code));
  });
}
