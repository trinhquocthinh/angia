import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { requireMain } from '@src/shared/auth/presentation/requireMain.js';
import { limitPrivacyBody } from './limitPrivacyBody.js';
export function registerPrivacyGuards(app: OpenAPIHono<AppEnv>): void {
  for (const path of [
    '/api/source-documents/:id/privacy-drafts',
    '/api/source-documents/:id/privacy-draft',
    '/api/source-documents/:id/privacy-drafts/:draftId/image',
    '/api/source-documents/:id/privacy-approval',
    '/api/source-documents/:id/manual-entry',
  ]) {
    app.use(path, requireMain(), limitPrivacyBody());
  }
}
