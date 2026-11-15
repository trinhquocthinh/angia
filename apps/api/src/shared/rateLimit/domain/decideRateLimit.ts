import type { RateLimitPolicy } from './RateLimitPolicy.js';

export function decideRateLimit(
  policy: RateLimitPolicy,
  now: number,
  count: number,
  mode: 'consume' | 'check',
) {
  const windowStart = Math.floor(now / policy.windowMs) * policy.windowMs;
  return {
    windowStart,
    blocked: mode === 'consume' ? count > policy.limit : count >= policy.limit,
    retryAfterSeconds: Math.max(1, Math.ceil((windowStart + policy.windowMs - now) / 1000)),
  };
}
