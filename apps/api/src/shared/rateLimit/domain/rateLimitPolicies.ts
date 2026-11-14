import type { RateLimitPolicy } from './RateLimitPolicy.js';

export const rateLimitPolicies = {
  register: { kind: 'register', limit: 5, windowMs: 3_600_000 },
  login_failed: { kind: 'login_failed', limit: 10, windowMs: 900_000 },
} as const satisfies Record<string, RateLimitPolicy>;
