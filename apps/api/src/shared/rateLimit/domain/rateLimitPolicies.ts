import type { RateLimitPolicy } from './RateLimitPolicy.js';

export const rateLimitPolicies = {
  email_verification_send: { kind: 'email_verification_send', limit: 3, windowMs: 3_600_000 },
  register: { kind: 'register', limit: 5, windowMs: 3_600_000 },
  login_failed: { kind: 'login_failed', limit: 10, windowMs: 900_000 },
} as const satisfies Record<string, RateLimitPolicy>;
