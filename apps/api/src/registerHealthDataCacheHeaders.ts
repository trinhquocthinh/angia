import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { registerPainJournalCacheControl } from '@src/features/painJournal/presentation/registerPainJournalCacheControl.js';

export function registerHealthDataCacheHeaders(app: OpenAPIHono<AppEnv>): void {
  app.use('/api/source-documents/*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    c.header('X-Content-Type-Options', 'nosniff');
    await next();
  });
  registerPainJournalCacheControl(app);
}
