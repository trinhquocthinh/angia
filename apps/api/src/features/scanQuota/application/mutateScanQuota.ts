import {
  budgetMonth,
  type GrantScanQuotasRequest,
  type UpdateScanQuotaPolicyRequest,
} from '@angia/contracts';
import type { ScanQuotaDependencies, ScanQuotaOutcome } from './ports.js';
// Một mốc thời gian cho cả kiểm tra tháng, giao dịch và phản hồi; không đổi tháng giữa chừng.
export async function mutateScanQuota(
  deps: ScanQuotaDependencies,
  kind: 'policy' | 'grant',
  request: UpdateScanQuotaPolicyRequest | GrantScanQuotasRequest,
  actorId: string,
): Promise<ScanQuotaOutcome> {
  const context = { now: deps.now(), recheckNow: deps.now, defaultMonthlyCapUsd: deps.defaultMonthlyCapUsd };
  if (request.month !== budgetMonth(context.now)) return { ok: false, code: 'ERR_SCAN_QUOTA_CONFLICT' };
  return kind === 'policy'
    ? deps.repository.updatePolicy(request as UpdateScanQuotaPolicyRequest, actorId, context)
    : deps.repository.grant(request as GrantScanQuotasRequest, actorId, context);
}
