import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { requireTrustedJson } from '@src/features/account/presentation/requireTrustedJson.js';
import { rateLimitByIp } from '@src/shared/rateLimit/presentation/rateLimitByIp.js';
import { rateLimitPolicies } from '@src/shared/rateLimit/domain/rateLimitPolicies.js';
import type { RateLimitDependencies } from '@src/shared/rateLimit/application/ports.js';
import type { ClientIpResolver } from '@src/shared/rateLimit/application/ClientIpResolver.js';
import { inspectHouseholdInvitation } from '../application/inspectHouseholdInvitation.js';
import type { InvitationInspectionRepository } from '../application/inspectionPorts.js';
import { inspectHouseholdInvitationRoute } from './inspectHouseholdInvitationRouteDefinition.js';

interface InspectDependencies {
  repository: InvitationInspectionRepository;
  appBaseUrl: string;
  rateLimit: RateLimitDependencies;
  clientIp: ClientIpResolver;
}

export function registerInspectHouseholdInvitationRoute(
  app: OpenAPIHono<AppEnv>,
  deps: InspectDependencies,
): void {
  const path = inspectHouseholdInvitationRoute.path;
  requireTrustedJson(app, path, deps.appBaseUrl);
  app.use(path, rateLimitByIp(deps.rateLimit, rateLimitPolicies.invitation_inspect, deps.clientIp));
  app.openapi(inspectHouseholdInvitationRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const result = await inspectHouseholdInvitation(deps.repository, c.req.valid('json').token);
    if (!result) return c.json(...errorJson('ERR_NOT_FOUND'));
    return c.json(result, 200);
  });
}
