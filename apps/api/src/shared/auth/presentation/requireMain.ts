import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';

// Route dữ liệu sức khỏe: chỉ vai trò main (BR-004); member và tài khoản chờ gán nhóm nhận ERR_FORBIDDEN (BR-005).
export function requireMain() {
  return createMiddleware<AppEnv>(async (c, next) => {
    const session = c.get('session');
    if (!session) {
      return errorResponse(c, 'ERR_UNAUTHENTICATED');
    }
    if (session.role !== 'main' || !session.family) {
      return errorResponse(c, 'ERR_FORBIDDEN');
    }
    await next();
  });
}
