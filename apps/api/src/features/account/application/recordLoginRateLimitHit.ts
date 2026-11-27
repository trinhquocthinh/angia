import type { RateLimitDependencies } from '@src/shared/rateLimit/application/ports.js';
import { recordRateLimitHit } from '@src/shared/rateLimit/application/recordRateLimitHit.js';
import { rateLimitPolicies } from '@src/shared/rateLimit/domain/rateLimitPolicies.js';

export async function recordLoginRateLimitHit(
  deps: RateLimitDependencies,
  key: { ip: string; username: string },
) {
  await Promise.all([
    recordRateLimitHit(deps, rateLimitPolicies.login_failed, key),
    recordRateLimitHit(deps, rateLimitPolicies.login_failed_ip, key.ip),
  ]);
}
