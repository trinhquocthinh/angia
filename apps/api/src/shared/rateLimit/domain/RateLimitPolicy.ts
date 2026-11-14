export type RateLimitPolicy = {
  kind: 'register' | 'login_failed';
  limit: number;
  windowMs: number;
};
