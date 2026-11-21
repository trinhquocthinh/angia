export type RateLimitPolicy = {
  kind: 'register' | 'login_failed' | 'email_verification_send';
  limit: number;
  windowMs: number;
};
