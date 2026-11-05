import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
// Đăng ký trước guard để cả lỗi phiên, quyền, CSRF và validation đều không được cache.
export function registerScanQuotaHeaders(app: OpenAPIHono<AppEnv>): void {
  for (const path of ['/api/admin/scan-quotas', '/api/admin/scan-quota-grants', '/api/family/scan-quota']) {
    app.use(path, async (c, next) => {
      c.header('Cache-Control', 'no-store');
      await next();
    });
  }
}
