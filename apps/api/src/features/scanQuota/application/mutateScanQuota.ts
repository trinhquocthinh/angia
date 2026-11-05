import { budgetMonth, type GrantScanQuotasRequest } from '@angia/contracts';
import type { ScanQuotaDependencies, ScanQuotaOutcome } from './ports.js';
// Một mốc thời gian cho cả kiểm tra tháng, giao dịch và phản hồi; không đổi tháng giữa chừng.
export async function mutateScanQuota(
  deps: ScanQuotaDependencies,
  request: GrantScanQuotasRequest,
  actorId: string,
): Promise<ScanQuotaOutcome> {
  const context = { now: deps.now(), recheckNow: deps.now, defaultMonthlyCapUsd: deps.defaultMonthlyCapUsd };
  if (request.month !== budgetMonth(context.now)) return { ok: false, code: 'ERR_SCAN_QUOTA_CONFLICT' };
  return deps.repository.grant(request, actorId, context);
}
