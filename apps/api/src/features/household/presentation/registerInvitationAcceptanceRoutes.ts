import type { RateLimitDependencies } from '@src/shared/rateLimit/application/ports.js';
import type { ClientIpResolver } from '@src/shared/rateLimit/application/ClientIpResolver.js';
import { acceptRateLimitedInvitation } from './acceptRateLimitedInvitation.js';
import type { InvitationInspectionRepository } from '../application/inspectionPorts.js';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import { requireAdmin } from '@src/shared/auth/presentation/requireAdmin.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type {
  FoundingInvitationRepository,
  InvitationAcceptanceRepository,
} from '../application/acceptancePorts.js';
import { createFoundingInvitation } from '../application/createFoundingInvitation.js';
import { revokeFoundingInvitation } from '../application/revokeFoundingInvitation.js';
import { acceptHouseholdInvitationRoute } from './acceptHouseholdInvitationRouteDefinition.js';
import {
  createFoundingInvitationRoute,
  revokeFoundingInvitationRoute,
} from './foundingInvitationRouteDefinitions.js';

export interface InvitationAcceptanceDependencies {
  inspection: InvitationInspectionRepository;
  acceptance: InvitationAcceptanceRepository;
  founding: FoundingInvitationRepository;
  appBaseUrl: string;
}

export function registerInvitationAcceptanceRoutes(
  app: OpenAPIHono<AppEnv>,
  deps: InvitationAcceptanceDependencies & { rateLimit: RateLimitDependencies; clientIp: ClientIpResolver },
): void {
  app.openapi(acceptHouseholdInvitationRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    return acceptRateLimitedInvitation(c, deps, c.req.valid('json').token);
  });
  app.use('/api/admin/founding-invitations', requireAdmin());
  app.use('/api/admin/founding-invitations/*', requireAdmin());
  app.openapi(createFoundingInvitationRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const session = currentSession(c);
    const actor = {
      accountId: session.account.id,
      isSystemAdmin: session.account.isSystemAdmin,
      authMethod: session.authMethod,
    };
    const result = await createFoundingInvitation(deps.founding, actor, deps.appBaseUrl);
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json({ ...result.value, expiresAt: result.value.expiresAt.toISOString() }, 201);
  });
  app.openapi(revokeFoundingInvitationRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const session = currentSession(c);
    const actor = {
      accountId: session.account.id,
      isSystemAdmin: session.account.isSystemAdmin,
      authMethod: session.authMethod,
    };
    const result = await revokeFoundingInvitation(deps.founding, actor, c.req.valid('param').id);
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.body(null, 204);
  });
}
