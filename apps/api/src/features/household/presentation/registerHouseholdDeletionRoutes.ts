import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { HouseholdDeletionRepository } from '../application/deletionPorts.js';
import { requestHouseholdDeletion } from '../application/requestHouseholdDeletion.js';
import { revokeHouseholdDeletion } from '../application/revokeHouseholdDeletion.js';
import {
  currentHouseholdDeletionRequestRoute,
  requestHouseholdDeletionRoute,
  revokeHouseholdDeletionRoute,
} from './deletionRequestRouteDefinitions.js';

import { getCurrentHouseholdDeletionRequest } from '../application/getCurrentHouseholdDeletionRequest.js';

export function registerHouseholdDeletionRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: HouseholdDeletionRepository,
) {
  app.openapi(currentHouseholdDeletionRequestRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const s = currentSession(c);
    const result = await getCurrentHouseholdDeletionRequest(repository, {
      accountId: s.account.id,
      familyId: s.family?.id ?? null,
      role: s.role,
    });
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(result.value, 200);
  });
  app.openapi(requestHouseholdDeletionRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const s = currentSession(c);
    const result = await requestHouseholdDeletion(
      repository,
      { accountId: s.account.id, familyId: s.family?.id ?? null, role: s.role },
      c.req.valid('json').confirmFamilyName,
    );
    if (result.ok)
      return c.json({ ...result.request, executeAt: result.request.executeAt.toISOString() }, 201);
    if (result.code === 'ERR_RECENT_REMOVAL')
      return c.json(...errorJson(result.code, { allowedAt: result.allowedAt.toISOString() }));
    return c.json(...errorJson(result.code));
  });
  app.openapi(revokeHouseholdDeletionRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const s = currentSession(c);
    const result = await revokeHouseholdDeletion(
      repository,
      { accountId: s.account.id, familyId: s.family?.id ?? null, role: s.role },
      c.req.valid('json').requestId,
    );
    if (result.ok) return c.body(null, 204);
    return c.json(...errorJson(result.code));
  });
}
