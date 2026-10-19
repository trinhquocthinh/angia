import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { requireMain } from '@src/shared/auth/presentation/requireMain.js';
import type { SlidingWindowLimiter } from '@src/shared/http/createSlidingWindowLimiter.js';
import { rateLimitHeavy } from '@src/shared/http/rateLimitHeavy.js';
import { limitPrivacyBody } from './limitPrivacyBody.js';
export function registerPrivacyGuards(app: OpenAPIHono<AppEnv>, limiter: SlidingWindowLimiter): void {
  for (const path of [
    '/api/source-documents/:id/privacy-drafts',
    '/api/source-documents/:id/privacy-draft',
    '/api/source-documents/:id/privacy-drafts/:draftId/image',
    '/api/source-documents/:id/privacy-approval',
    '/api/source-documents/:id/manual-entry',
  ]) {
    app.use(path, requireMain(), limitPrivacyBody());
  }
  // SPEC-030: hai thao tác tạo job worker; sau requireMain, trước mọi truy vấn DB.
  app.use('/api/source-documents/:id/privacy-drafts', rateLimitHeavy(limiter, 'privacy-draft'));
  app.use('/api/source-documents/:id/privacy-approval', rateLimitHeavy(limiter, 'privacy-approval'));
}
