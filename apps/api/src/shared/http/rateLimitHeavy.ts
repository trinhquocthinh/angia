import { createMiddleware } from 'hono/factory';
import type { AppEnv } from './AppEnv.js';
import type { SlidingWindowLimiter } from './createSlidingWindowLimiter.js';
import { errorResponse } from './errorResponse.js';

export type HeavyRoute = 'upload' | 'privacy-draft' | 'privacy-approval';

// SPEC-030: chặn nhịp thao tác nặng theo (tài khoản, thao tác) trước mọi truy vấn DB; chỉ đếm POST.
// Gắn sau requireMain nên phiên đã có tài khoản.
export function rateLimitHeavy(limiter: SlidingWindowLimiter, route: HeavyRoute) {
  return createMiddleware<AppEnv>(async (c, next) => {
    if (c.req.method !== 'POST') return next();
    const hit = limiter.hit(`${c.get('session')!.account.id}:${route}`);
    if (!hit.ok) {
      c.header('Retry-After', String(hit.retryAfterSeconds));
      return errorResponse(c, 'ERR_RATE_LIMITED');
    }
    await next();
  });
}
