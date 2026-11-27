import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';
import { consumeRateLimit } from '@src/shared/rateLimit/application/consumeRateLimit.js';
import type { RateLimitDependencies } from '@src/shared/rateLimit/application/ports.js';
import { rateLimitPolicies } from '@src/shared/rateLimit/domain/rateLimitPolicies.js';

export function limitInvitationCreation(rateLimit: RateLimitDependencies): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (c.req.method !== 'POST') return next();
    const session = currentSession(c);
    if (!session.family || session.role !== 'main') return next();
    try {
      const decision = await consumeRateLimit(
        rateLimit,
        rateLimitPolicies.invitation_create,
        session.family.id,
      );
      if (decision.blocked) {
        c.header('Cache-Control', 'no-store');
        c.header('Retry-After', String(decision.retryAfterSeconds));
        return errorResponse(c, 'ERR_RATE_LIMITED');
      }
    } catch {
      c.header('Cache-Control', 'no-store');
      return errorResponse(c, 'ERR_AUTH_UNAVAILABLE');
    }
    await next();
  };
}
