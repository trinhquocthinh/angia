import type { Context } from 'hono';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';
import { checkRateLimit } from '@src/shared/rateLimit/application/checkRateLimit.js';
import { recordRateLimitHit } from '@src/shared/rateLimit/application/recordRateLimitHit.js';
import type { RateLimitDependencies } from '@src/shared/rateLimit/application/ports.js';
import type { ClientIpResolver } from '@src/shared/rateLimit/application/ClientIpResolver.js';
import { rateLimitPolicies } from '@src/shared/rateLimit/domain/rateLimitPolicies.js';
import { acceptHouseholdInvitation } from '../application/acceptHouseholdInvitation.js';
import type { InvitationAcceptanceRepository } from '../application/acceptancePorts.js';

export async function acceptRateLimitedInvitation(
  c: Context<AppEnv>,
  deps: {
    acceptance: InvitationAcceptanceRepository;
    rateLimit: RateLimitDependencies;
    clientIp: ClientIpResolver;
  },
  token: string,
): Promise<Response> {
  const policy = rateLimitPolicies.invitation_accept_invalid;
  const ip = deps.clientIp(c);
  try {
    const decision = await checkRateLimit(deps.rateLimit, policy, ip);
    if (decision.blocked) {
      c.header('Retry-After', String(decision.retryAfterSeconds));
      return errorResponse(c, 'ERR_RATE_LIMITED');
    }
  } catch {
    return errorResponse(c, 'ERR_AUTH_UNAVAILABLE');
  }
  const result = await acceptHouseholdInvitation(deps.acceptance, currentSession(c).account.id, token);
  if (!result.ok && result.code === 'ERR_NOT_FOUND') {
    try {
      await recordRateLimitHit(deps.rateLimit, policy, ip);
    } catch {
      return errorResponse(c, 'ERR_AUTH_UNAVAILABLE');
    }
  }
  if (!result.ok) return errorResponse(c, result.code);
  return c.body(null, 204);
}
