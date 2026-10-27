import { budgetMonth } from '@angia/contracts';
import { sql } from 'drizzle-orm';
import { calculateScanCapacity } from '../domain/calculateScanCapacity.js';
import type { ScanQuotaContext } from '../application/ports.js';
import { readQuotaBilling } from './readQuotaBilling.js';
import { writeFamilyGrant } from './writeFamilyGrant.js';
import type { QuotaState, QuotaTx } from './quotaTypes.js';
// Đã giữ actor/singleton/tháng/ngân sách; qua tháng thì bỏ trial, vẫn tạo gia đình thành công.
export async function grantNewFamilyTrial(
  tx: QuotaTx,
  familyId: string,
  actorId: string,
  context: ScanQuotaContext,
  state: QuotaState,
): Promise<void> {
  if (!state.policy || state.version === Number.MAX_SAFE_INTEGER) return;
  const month = budgetMonth(context.now);
  const finalContext = { ...context, now: context.recheckNow?.() ?? context.now };
  if (month !== budgetMonth(finalContext.now)) return;
  const billing = await readQuotaBilling(tx, month, finalContext);
  if (billing.actualSpendUsd === null) return;
  const capacity = calculateScanCapacity({
    capUsd: billing.monthlyCapUsd,
    actualSpendUsd: billing.actualSpendUsd,
    ...state.policy,
    committedRemainingScans: state.committed,
  });
  if (BigInt(state.policy.trialScans) > BigInt(capacity.availableAdditionalScans)) return;
  await writeFamilyGrant(tx, {
    familyId,
    actorId,
    now: finalContext.now,
    month,
    version: state.version + 1,
    total: state.policy.trialScans,
    status: 'trial',
    reason: 'Cấp lượt dùng thử khi tạo gia đình mới.',
    before: null,
  });
  await tx.execute(
    sql`UPDATE scan_quota_months SET committed_remaining_scans=committed_remaining_scans+${state.policy.trialScans} WHERE month=${month}`,
  );
  await tx.execute(sql`UPDATE scan_quota_policy SET version=version+1 WHERE id=1`);
}
