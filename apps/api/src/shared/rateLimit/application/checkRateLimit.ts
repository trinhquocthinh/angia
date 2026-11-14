import type { RateLimitPolicy } from '../domain/RateLimitPolicy.js';
import { decideRateLimit } from '../domain/decideRateLimit.js';
import type { RateLimitDependencies, RateLimitKey } from './ports.js';

export async function checkRateLimit(
  deps: RateLimitDependencies,
  policy: RateLimitPolicy,
  key: RateLimitKey,
) {
  const now = deps.now();
  const { windowStart } = decideRateLimit(policy, now, 0, 'check');
  const count = await deps.store.read(deps.keyHasher(policy.kind, key), windowStart);
  return decideRateLimit(policy, now, count, 'check');
}
