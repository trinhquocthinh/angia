import type { RateLimitPolicy } from './RateLimitPolicy.js';

export const rateLimitPolicies = {
  data_export_request: { kind: 'data_export_request', limit: 3, windowMs: 86_400_000 },
  password_reset_request_ip: { kind: 'password_reset_request_ip', limit: 3, windowMs: 3_600_000 },
  password_reset_request_email: { kind: 'password_reset_request_email', limit: 3, windowMs: 3_600_000 },
  email_verification_send: { kind: 'email_verification_send', limit: 3, windowMs: 3_600_000 },
  register: { kind: 'register', limit: 5, windowMs: 3_600_000 },
  login_failed: { kind: 'login_failed', limit: 10, windowMs: 900_000 },
} as const satisfies Record<string, RateLimitPolicy>;
