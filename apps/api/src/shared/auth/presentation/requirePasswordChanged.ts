import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';

export function requirePasswordChanged() {
  return createMiddleware<AppEnv>(async (c, next) => {
    const allowed =
      c.req.method === 'POST' && (c.req.path === '/api/me/password' || c.req.path === '/api/auth/logout');
    if (c.get('session')?.passwordChangeRequired && !allowed) {
      return errorResponse(c, 'ERR_PASSWORD_CHANGE_REQUIRED');
    }
    await next();
  });
}
