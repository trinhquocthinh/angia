import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { HouseholdOwnershipRepository } from '../application/ownershipPorts.js';
import { offerHouseholdOwnership } from '../application/offerHouseholdOwnership.js';
import { decideHouseholdOwnership } from '../application/decideHouseholdOwnership.js';
import { revokeHouseholdOwnership } from '../application/revokeHouseholdOwnership.js';
import {
  currentHouseholdOwnershipOfferRoute,
  offerHouseholdOwnershipRoute,
  decideHouseholdOwnershipRoute,
  revokeHouseholdOwnershipRoute,
} from './ownershipOfferRouteDefinitions.js';

import { getCurrentHouseholdOwnershipOffer } from '../application/getCurrentHouseholdOwnershipOffer.js';

export function registerHouseholdOwnershipRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: HouseholdOwnershipRepository,
) {
  app.openapi(currentHouseholdOwnershipOfferRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const s = currentSession(c);
    const result = await getCurrentHouseholdOwnershipOffer(repository, {
      accountId: s.account.id,
      familyId: s.family?.id ?? null,
      role: s.role,
    });
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(result.value, 200);
  });
  app.openapi(offerHouseholdOwnershipRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const s = currentSession(c);
    const result = await offerHouseholdOwnership(
      repository,
      { accountId: s.account.id, familyId: s.family?.id ?? null, role: s.role },
      c.req.valid('json').targetAccountId,
    );
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json({ ...result.offer, createdAt: result.offer.createdAt.toISOString() }, 201);
  });
  app.openapi(decideHouseholdOwnershipRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const s = currentSession(c);
    const result = await decideHouseholdOwnership(
      repository,
      { accountId: s.account.id, familyId: s.family?.id ?? null, role: s.role },
      c.req.valid('param').id,
      c.req.valid('json').accept,
    );
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.body(null, 204);
  });
  app.openapi(revokeHouseholdOwnershipRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const s = currentSession(c);
    const result = await revokeHouseholdOwnership(
      repository,
      { accountId: s.account.id, familyId: s.family?.id ?? null, role: s.role },
      c.req.valid('param').id,
    );
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.body(null, 204);
  });
}
