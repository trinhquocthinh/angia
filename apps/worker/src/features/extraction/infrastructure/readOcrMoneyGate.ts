import type pg from 'pg';
import { OcrGateBlockedError } from '../application/OcrGateBlockedError.js';

// CP5.6: có nguồn OpenRouter và mọi nguồn đầy đủ, mới <=180s; numeric so sánh trước khi làm tròn.
export async function assertOcrMoneyGate(
  client: pg.PoolClient,
  month: string,
  defaultCapUsd: number,
  now: Date,
): Promise<void> {
  const result = await client.query<{ ready: boolean; under_cap: boolean }>(
    `WITH sources AS (
    SELECT count(*)>0 AND coalesce(bool_and(status='complete'
      AND last_attempt_at IS NOT NULL AND last_complete_at IS NOT NULL
      AND last_complete_at <= $3::timestamptz
      AND last_complete_at >= $3::timestamptz-interval '180 seconds'),false) AS ready FROM ai_billing_sources
  ), money AS (
    SELECT coalesce(sum(counter_amount/unit_divisor),0) AS spent FROM ai_provider_charges
    WHERE charged_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh')
      AND charged_at < (($1::date+interval '1 month') AT TIME ZONE 'Asia/Ho_Chi_Minh')
  ) SELECT sources.ready, money.spent < COALESCE((SELECT cap_usd FROM extraction_spend WHERE month=to_char($1::date,'YYYY-MM')),
    (SELECT cap_usd FROM extraction_spend ORDER BY month DESC LIMIT 1),$2::numeric) AS under_cap FROM sources,money`,
    [`${month}-01`, defaultCapUsd, now],
  );
  if (!result.rows[0]?.ready) throw new OcrGateBlockedError('billing_unavailable');
  if (!result.rows[0].under_cap) throw new OcrGateBlockedError('budget_exhausted');
}
