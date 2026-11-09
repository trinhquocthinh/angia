import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';

// Gắn trước requireSession/CSRF/requireMain để cả lỗi quyền cũng không được cache.
export function registerPainJournalCacheControl(app: OpenAPIHono<AppEnv>): void {
  for (const base of ['/api/health-profiles/:id/pain-issues', '/api/me/profile/pain-issues']) {
    for (const path of [base, `${base}/*`]) {
      app.use(path, async (c, next) => {
        c.header('Cache-Control', 'no-store');
        await next();
      });
    }
  }
}
