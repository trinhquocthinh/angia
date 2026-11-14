import { createMiddleware } from 'hono/factory';
import type { Logger } from 'pino';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';
import type { LegalRepository } from '../application/ports.js';

const ALLOWED = new Set([
  'GET /api/me',
  'POST /api/auth/logout',
  'POST /api/me/password',
  'POST /api/me/local-credential',
  'POST /api/me/legal-acceptances',
]);
// SPEC-072 (tải dữ liệu) và SPEC-073 (xoá tài khoản) chưa có route; thêm vào đây khi triển khai.
export function requireLegalAcceptance(legal: LegalRepository, logger: Pick<Logger, 'warn'>) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const session = c.get('session');
    if (!session || ALLOWED.has(`${c.req.method} ${c.req.path}`)) return next();
    const status = await legal.status(session.account.id);
    if (status.missingDocuments) logger.warn('Thiếu văn bản pháp lý hiện hành');
    if (status.missingDocuments || !status.accepted) return errorResponse(c, 'ERR_LEGAL_ACCEPTANCE_REQUIRED');
    await next();
  });
}
