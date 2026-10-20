import type { Logger } from 'pino';
import type { IdpSyncDependencies, IdpSyncPolicy } from '@src/features/idpSessionSync/application/ports.js';
import { syncIdpSessions } from '@src/features/idpSessionSync/application/syncIdpSessions.js';

// SPEC-033: log chỉ có số đếm, accountId (uuid nội bộ) và mã lý do — không uid/email/tên/token.
// Lượt không đổi gì log debug để không sinh 288 dòng/ngày.
export function handleSyncIdpSessionsJob(deps: IdpSyncDependencies, policy: IdpSyncPolicy, logger: Logger) {
  return async (job: { id: string }) => {
    const result = await syncIdpSessions(deps, policy);
    const { revoke, adminOn, adminOff, ...rest } = result;
    const summary = {
      jobId: job.id,
      ...rest,
      revoked: revoke.length,
      adminOn: adminOn.length,
      adminOff: adminOff.length,
    };
    if (result.outcome === 'error' || result.capped)
      logger.error(
        summary,
        'Đồng bộ phiên với IdP không áp dụng: lỗi đọc Authentik/DB hoặc vượt trần thu hồi',
      );
    else if (result.outcome === 'skipped')
      logger.error(summary, 'Đồng bộ phiên với IdP bỏ qua: nhóm truy cập rỗng hoặc không khớp tài khoản nào');
    else if (revoke.length + adminOn.length + adminOff.length > 0)
      logger.warn(
        {
          ...summary,
          revokedAccountIds: revoke,
          adminOnAccountIds: adminOn,
          adminOffAccountIds: adminOff,
        },
        'Đã đồng bộ phiên và quyền quản trị với IdP',
      );
    else logger.debug(summary, 'Đồng bộ phiên với IdP: không có thay đổi');
    return result;
  };
}
