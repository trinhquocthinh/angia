import type { MiddlewareHandler } from 'hono';
import { errorResponse } from '@src/shared/http/errorResponse.js';
import { consumeRateLimit } from '../application/consumeRateLimit.js';
import type { RateLimitDependencies } from '../application/ports.js';
import type { RateLimitPolicy } from '../domain/RateLimitPolicy.js';
import type { ClientIpResolver } from '../application/ClientIpResolver.js';

// Đếm mọi request tới đây theo IP; lỗi store thì chặn (fail closed) thay vì bỏ qua giới hạn.
export function rateLimitByIp(
  deps: RateLimitDependencies,
  policy: RateLimitPolicy,
  clientIp: ClientIpResolver,
): MiddlewareHandler {
  return async (c, next) => {
    try {
      const decision = await consumeRateLimit(deps, policy, clientIp(c));
      if (decision.blocked) {
        c.header('Set-Cookie', undefined);
        c.header('Retry-After', String(decision.retryAfterSeconds));
        return errorResponse(c, 'ERR_RATE_LIMITED');
      }
    } catch {
      c.header('Set-Cookie', undefined);
      return errorResponse(c, 'ERR_AUTH_UNAVAILABLE');
    }
    await next();
  };
}
