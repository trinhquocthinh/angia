import { sql } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { readQuotaBilling } from '@src/features/scanQuota/infrastructure/readQuotaBilling.js';
import type { AiBudgetPolicy } from '../application/ports.js';
import type { AiBudgetSnapshot } from '../domain/evaluateAiBudget.js';
interface ScanRow extends Record<string, unknown> {
  granted_scans: string;
  used_scans: string;
  held_scans: string;
}
// Chỉ đọc, RLS theo gia đình; không dùng tiền lịch sử của gia đình làm cổng OCR.
export async function readAiBudget(
  tx: FamilyScopedTx,
  familyId: string,
  month: string,
  policy: AiBudgetPolicy,
): Promise<AiBudgetSnapshot> {
  const scans = await tx.execute<ScanRow>(sql`
    SELECT granted_scans::text, used_scans::text, held_scans::text
    FROM family_scan_quotas WHERE family_id=${familyId} AND month=${month}`);
  const billing = await readQuotaBilling(tx, month, {
    now: policy.now(),
    defaultMonthlyCapUsd: policy.defaultMonthlyCapUsd,
  });
  const row = scans.rows[0];
  return {
    grantedScans: Number(row?.granted_scans ?? policy.defaultMonthlyScans ?? 0),
    usedScans: Number(row?.used_scans ?? 0),
    heldScans: Number(row?.held_scans ?? 0),
    billingAvailable: billing.billingStatus === 'ready',
    budgetExhausted: billing.budgetExhausted,
  };
}
