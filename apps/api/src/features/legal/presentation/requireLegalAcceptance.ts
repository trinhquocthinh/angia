import { createMiddleware } from 'hono/factory';
import type { Logger } from 'pino';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';
import type { LegalRepository } from '../application/ports.js';

const ALLOWED = new Set([
  'GET /api/me',
  'POST /api/me/data-exports',
  'POST /api/me/account-deletion',
  'GET /api/me/data-exports/{id}',
  'GET /api/me/data-exports/{id}/file',
  'POST /api/auth/logout',
  'POST /api/me/password',
  'POST /api/me/local-credential',
  'POST /api/me/legal-acceptances',
]);
// SPEC-072/073: tải dữ liệu và xoá tài khoản luôn được phép.
export function requireLegalAcceptance(legal: LegalRepository, logger: Pick<Logger, 'warn'>) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const session = c.get('session');
    const path = c.req.path.replace(
      /^\/api\/me\/data-exports\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/file$|$)/i,
      '/api/me/data-exports/{id}',
    );
    if (!session || ALLOWED.has(`${c.req.method} ${path}`)) return next();
    const status = await legal.status(session.account.id);
    if (status.missingDocuments) logger.warn('Thiếu văn bản pháp lý hiện hành');
    if (status.missingDocuments || !status.accepted) return errorResponse(c, 'ERR_LEGAL_ACCEPTANCE_REQUIRED');
    await next();
  });
}
