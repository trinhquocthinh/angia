import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { HouseholdMembershipRepository } from '../application/membershipPorts.js';
import { listHouseholdMembers } from '../application/listHouseholdMembers.js';
import { listHouseholdMembersRoute } from './listHouseholdMembersRouteDefinition.js';
import { changeHouseholdMember } from '../application/changeHouseholdMember.js';
import { changeHouseholdMemberRoute } from './changeHouseholdMemberRouteDefinition.js';

export function registerHouseholdMembershipRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: HouseholdMembershipRepository,
) {
  app.openapi(listHouseholdMembersRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const session = currentSession(c);
    const result = await listHouseholdMembers(repository, {
      accountId: session.account.id,
      familyId: session.family?.id ?? null,
      role: session.role,
    });
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(result.value, 200);
  });
  app.openapi(changeHouseholdMemberRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const session = currentSession(c);
    const result = await changeHouseholdMember(
      repository,
      {
        accountId: session.account.id,
        familyId: session.family?.id ?? null,
        role: session.role,
      },
      c.req.valid('param').targetAccountId,
      c.req.valid('json'),
    );
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.body(null, 204);
  });
}
