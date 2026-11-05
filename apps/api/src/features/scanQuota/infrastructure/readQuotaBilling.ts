import { sql } from 'drizzle-orm';
import { getAiBilling } from '@src/features/aiBilling/application/getAiBilling.js';
import type { AiBillingSource } from '@src/features/aiBilling/application/ports.js';
import type { ScanQuotaContext } from '../application/ports.js';
import type { QuotaTx } from './quotaTypes.js';
interface SourceRow extends Record<string, unknown> {
  id: string;
  provider: AiBillingSource['provider'];
  status: AiBillingSource['status'];
  attempt: string | null;
  complete: string | null;
  spend: string;
  total: string;
}
// Đọc trong cùng giao dịch cấp phát sau khi khóa ngân sách.
export async function readQuotaBilling(tx: QuotaTx, month: string, context: ScanQuotaContext) {
  const cap = await tx.execute<{ cap: string; exhausted: boolean }>(
    sql`WITH budget AS (SELECT COALESCE((SELECT cap_usd FROM extraction_spend WHERE month=${month}),
      (SELECT cap_usd FROM extraction_spend ORDER BY month DESC LIMIT 1), ${context.defaultMonthlyCapUsd}::numeric) AS cap),
      actual AS (SELECT coalesce(sum(counter_amount / unit_divisor), 0) AS spend FROM ai_provider_charges
        WHERE charged_at >= (${month + '-01'}::date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh')
          AND charged_at < ((${month + '-01'}::date + interval '1 month') AT TIME ZONE 'Asia/Ho_Chi_Minh'))
      SELECT round(budget.cap, 12)::text AS cap, actual.spend >= budget.cap AS exhausted FROM budget, actual`,
  );
  const sources = await tx.execute<SourceRow>(sql`WITH monthly AS (
    SELECT source_id, sum(counter_amount / unit_divisor) AS spend FROM ai_provider_charges
    WHERE charged_at >= (${month + '-01'}::date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh')
      AND charged_at < ((${month + '-01'}::date + interval '1 month') AT TIME ZONE 'Asia/Ho_Chi_Minh') GROUP BY source_id
  ) SELECT s.id, s.provider, s.status, s.last_attempt_at AS attempt, s.last_complete_at AS complete,
    round(coalesce(m.spend, 0), 12)::text AS spend, round(sum(coalesce(m.spend, 0)) OVER (), 12)::text AS total
    FROM ai_billing_sources s LEFT JOIN monthly m ON m.source_id=s.id ORDER BY s.provider, s.id`);
  const snapshot = {
    confirmedSpendUsd: sources.rows[0]?.total ?? '0.000000000000',
    sources: sources.rows.map((row) => ({
      id: row.id,
      provider: row.provider,
      status: row.status,
      confirmedSpendUsd: row.spend,
      lastAttemptAt: row.attempt === null ? null : new Date(row.attempt).toISOString(),
      lastCompleteAt: row.complete === null ? null : new Date(row.complete).toISOString(),
    })),
  };
  const billing = await getAiBilling({
    now: () => context.now,
    repository: { readMonth: async () => snapshot },
  });
  return {
    monthlyCapUsd: cap.rows[0]!.cap,
    actualSpendUsd: billing.actualSpendUsd,
    billingStatus: billing.status,
    budgetExhausted: cap.rows[0]!.exhausted,
  };
}
