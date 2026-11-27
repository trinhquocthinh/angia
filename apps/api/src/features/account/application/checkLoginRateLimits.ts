import { checkRateLimit } from '@src/shared/rateLimit/application/checkRateLimit.js';
import type { RateLimitDependencies } from '@src/shared/rateLimit/application/ports.js';
import { rateLimitPolicies } from '@src/shared/rateLimit/domain/rateLimitPolicies.js';

export async function checkLoginRateLimits(
  deps: RateLimitDependencies,
  key: { ip: string; username: string },
) {
  const limits = await Promise.all([
    checkRateLimit(deps, rateLimitPolicies.login_failed, key),
    checkRateLimit(deps, rateLimitPolicies.login_failed_ip, key.ip),
  ]);
  const blocked = limits.filter((limit) => limit.blocked);
  return {
    blocked: blocked.length > 0,
    retryAfterSeconds: Math.max(1, ...blocked.map((limit) => limit.retryAfterSeconds)),
  };
}
