import type pg from 'pg';
import type { AiBillingRepository, AiBillingSource } from '../application/ports.js';

interface BillingRow {
  id: string;
  provider: AiBillingSource['provider'];
  status: AiBillingSource['status'];
  last_attempt_at: Date | null;
  last_complete_at: Date | null;
  confirmed_spend: string;
  total_spend: string;
}

// Một truy vấn giữ ảnh chụp nhất quán; mọi phép cộng giữ kiểu numeric PostgreSQL.
export function createAiBillingRepository(pool: pg.Pool): AiBillingRepository {
  return {
    readMonth: async (month) => {
      const { rows } = await pool.query<BillingRow>(
        `
        WITH monthly AS (
          SELECT source_id, sum(counter_amount / unit_divisor) AS spend
          FROM ai_provider_charges
          WHERE charged_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh')
            AND charged_at < (($1::date + interval '1 month') AT TIME ZONE 'Asia/Ho_Chi_Minh')
          GROUP BY source_id
        )
        SELECT s.id, s.provider, s.status, s.last_attempt_at, s.last_complete_at,
          round(coalesce(m.spend, 0), 12)::text AS confirmed_spend,
          round(sum(coalesce(m.spend, 0)) OVER (), 12)::text AS total_spend
        FROM ai_billing_sources s LEFT JOIN monthly m ON m.source_id = s.id
        ORDER BY s.provider, s.id`,
        [`${month}-01`],
      );
      return {
        confirmedSpendUsd: rows[0]?.total_spend ?? '0.000000000000',
        sources: rows.map((row) => ({
          id: row.id,
          provider: row.provider,
          status: row.status,
          confirmedSpendUsd: row.confirmed_spend,
          lastAttemptAt: row.last_attempt_at?.toISOString() ?? null,
          lastCompleteAt: row.last_complete_at?.toISOString() ?? null,
        })),
      };
    },
  };
}
