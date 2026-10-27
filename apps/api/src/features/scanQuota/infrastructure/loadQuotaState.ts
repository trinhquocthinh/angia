import { sql } from 'drizzle-orm';
import type { QuotaState, QuotaTx } from './quotaTypes.js';
interface StateRow extends Record<string, unknown> {
  version: string;
  estimate: string | null;
  reserve: number | null;
  trial: string | null;
  committed: string;
}
// Thứ tự khóa CP5.3/CP5.4: actor account → singleton → tháng → ngân sách → gia đình theo ID.
export async function loadQuotaState(tx: QuotaTx, month: string, lock = false): Promise<QuotaState> {
  if (lock) {
    await tx.execute(sql`INSERT INTO scan_quota_policy (id) VALUES (1) ON CONFLICT DO NOTHING`);
    await tx.execute(sql`SELECT id FROM scan_quota_policy WHERE id = 1 FOR UPDATE`);
    await tx.execute(sql`INSERT INTO scan_quota_months (month) VALUES (${month}) ON CONFLICT DO NOTHING`);
    await tx.execute(sql`SELECT month FROM scan_quota_months WHERE month = ${month} FOR UPDATE`);
  }
  const result = await tx.execute<StateRow>(sql`SELECT
    COALESCE((SELECT version FROM scan_quota_policy WHERE id=1), 0)::text AS version,
    (SELECT round(estimated_cost_per_scan_usd, 12)::text FROM scan_quota_policy WHERE id=1) AS estimate,
    (SELECT reserve_basis_points FROM scan_quota_policy WHERE id=1) AS reserve,
    (SELECT trial_scans::text FROM scan_quota_policy WHERE id=1) AS trial,
    COALESCE((SELECT committed_remaining_scans FROM scan_quota_months WHERE month=${month}), 0)::text AS committed`);
  const row = result.rows[0]!;
  return {
    version: Number(row.version),
    committed: row.committed,
    policy:
      row.estimate === null
        ? null
        : {
            estimatedCostPerScanUsd: row.estimate,
            reserveBasisPoints: row.reserve!,
            trialScans: Number(row.trial),
          },
  };
}
