import { sql } from 'drizzle-orm';
import type { ScanQuotaDefaults } from '../application/ports.js';
import type { QuotaState, QuotaTx } from './quotaTypes.js';
interface StateRow extends Record<string, unknown> {
  version: string;
  committed: string;
  used: string;
}
// Thứ tự khóa CP5.3/CP5.4: actor account → singleton → tháng → ngân sách → gia đình theo ID.
export async function loadQuotaState(
  tx: QuotaTx,
  month: string,
  defaults: ScanQuotaDefaults,
  lock = false,
): Promise<QuotaState> {
  if (lock) {
    await tx.execute(sql`INSERT INTO scan_quota_policy (id) VALUES (1) ON CONFLICT DO NOTHING`);
    await tx.execute(sql`SELECT id FROM scan_quota_policy WHERE id = 1 FOR UPDATE`);
    await tx.execute(sql`INSERT INTO scan_quota_months (month) VALUES (${month}) ON CONFLICT DO NOTHING`);
    await tx.execute(sql`SELECT month FROM scan_quota_months WHERE month = ${month} FOR UPDATE`);
  }
  // CP5.5: gia đình chưa có dòng tháng vẫn cam kết đủ lượt mặc định.
  const result = await tx.execute<StateRow>(sql`WITH m AS (
    SELECT committed_remaining_scans, quota_families, used_scans FROM scan_quota_months WHERE month=${month})
    SELECT COALESCE((SELECT version FROM scan_quota_policy WHERE id=1), 0)::text AS version,
    (COALESCE((SELECT committed_remaining_scans FROM m), 0) + ${defaults.monthlyScans}::numeric *
      GREATEST(0, (SELECT count(*) FROM families) - COALESCE((SELECT quota_families FROM m), 0)))::text AS committed,
    COALESCE((SELECT used_scans FROM m), 0)::text AS used`);
  const row = result.rows[0]!;
  return {
    version: Number(row.version),
    committed: row.committed,
    usedScans: Number(row.used),
    policy: {
      estimatedCostPerScanUsd: defaults.initialCostPerScanUsd,
      reserveBasisPoints: defaults.reserveBasisPoints,
      trialScans: defaults.monthlyScans,
    },
  };
}
