import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';

// Route /api/admin/*: chỉ Quản trị hệ thống (BR-006); quyền admin không mở đọc dữ liệu sức khỏe (BR-003).
export function requireAdmin() {
  return createMiddleware<AppEnv>(async (c, next) => {
    const session = c.get('session');
    if (!session) {
      return errorResponse(c, 'ERR_UNAUTHENTICATED');
    }
    if (!session.account.isSystemAdmin) {
      return errorResponse(c, 'ERR_FORBIDDEN');
    }
    await next();
  });
}
