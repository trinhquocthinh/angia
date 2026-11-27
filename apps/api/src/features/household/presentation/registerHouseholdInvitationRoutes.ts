import type { RateLimitDependencies } from '@src/shared/rateLimit/application/ports.js';
import { limitInvitationCreation } from './limitInvitationCreation.js';
import { currentHouseholdInvitationsRoute } from './currentHouseholdInvitationsRoute.js';
import { getCurrentHouseholdInvitations } from '../application/getCurrentHouseholdInvitations.js';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { manageHouseholdInvitations } from '../application/manageHouseholdInvitations.js';
import { replaceHouseholdInvitation } from '../application/replaceHouseholdInvitation.js';
import {
  listHouseholdInvitationsRoute,
  replaceHouseholdInvitationRoute,
} from './manageHouseholdInvitationRouteDefinitions.js';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { SessionContext } from '@src/shared/auth/domain/SessionContext.js';
import type { HouseholdInvitationDependencies } from '../application/invitationPorts.js';
import { createHouseholdInvitation } from '../application/createHouseholdInvitation.js';
import { revokeHouseholdInvitation } from '../application/revokeHouseholdInvitation.js';
import { createHouseholdInvitationRoute } from './createHouseholdInvitationRouteDefinition.js';
import { revokeHouseholdInvitationRoute } from './revokeHouseholdInvitationRouteDefinition.js';

const actorOf = (session: SessionContext) => ({
  accountId: session.account.id,
  familyId: session.family?.id ?? null,
  role: session.role,
});

export function registerHouseholdInvitationRoutes(
  app: OpenAPIHono<AppEnv>,
  deps: HouseholdInvitationDependencies & { rateLimit: RateLimitDependencies },
): void {
  const limit = limitInvitationCreation(deps.rateLimit);
  app.use('/api/family/invitations', limit);
  app.use('/api/family/invitations/:id/replace', limit);
  app.openapi(currentHouseholdInvitationsRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const result = await getCurrentHouseholdInvitations(deps, actorOf(currentSession(c)));
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(result.value, 200);
  });
  app.openapi(listHouseholdInvitationsRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const result = await manageHouseholdInvitations(
      deps,
      actorOf(currentSession(c)),
      c.req.valid('query').offset,
    );
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(result.value, 200);
  });
  app.openapi(replaceHouseholdInvitationRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const actor = actorOf(currentSession(c));
    const result = await replaceHouseholdInvitation(deps, actor, c.req.valid('param').id);
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json({ ...result.value, expiresAt: result.value.expiresAt.toISOString() }, 201);
  });
  app.openapi(createHouseholdInvitationRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const actor = actorOf(currentSession(c));
    const result = await createHouseholdInvitation(deps, actor, c.req.valid('json'));
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json({ ...result.value, expiresAt: result.value.expiresAt.toISOString() }, 201);
  });
  app.openapi(revokeHouseholdInvitationRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const result = await revokeHouseholdInvitation(
      deps.repository,
      actorOf(currentSession(c)),
      c.req.valid('param').id,
    );
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.body(null, 204);
  });
}
