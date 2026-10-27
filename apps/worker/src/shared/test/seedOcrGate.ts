import { randomUUID } from 'node:crypto';
import { budgetMonth } from '@angia/contracts';
import type pg from 'pg';

/** Quota cấp tường minh và coverage hai nguồn mới; không gọi dịch vụ AI/billing. */
export async function seedOcrGate(owner: pg.Client, familyId: string, now: Date, granted = 10) {
  const month = budgetMonth(now);
  await owner.query('INSERT INTO scan_quota_policy(id) VALUES(1) ON CONFLICT DO NOTHING');
  await owner.query('INSERT INTO scan_quota_months(month) VALUES($1) ON CONFLICT DO NOTHING', [month]);
  await owner.query(
    `INSERT INTO family_scan_quotas(family_id,month,status,granted_scans,updated_at,updated_by)
    SELECT $1,$2,'approved',$3,$4,id FROM accounts WHERE family_id=$1
    ON CONFLICT(family_id,month) DO NOTHING`,
    [familyId, month, granted, now],
  );
  await owner.query(
    `UPDATE scan_quota_months SET committed_remaining_scans=(
    SELECT coalesce(sum(granted_scans-used_scans),0) FROM family_scan_quotas WHERE month=$1) WHERE month=$1`,
    [month],
  );
  for (const provider of ['openrouter', 'woku']) {
    const fingerprint = `fixture-${provider}`;
    await owner.query(
      `INSERT INTO ai_billing_sources(id,provider,credential_fingerprint,status,last_attempt_at,last_complete_at)
      VALUES($1,$2,$3,'complete',$4,$4) ON CONFLICT(provider,credential_fingerprint)
      DO UPDATE SET status='complete',last_attempt_at=$4,last_complete_at=$4`,
      [randomUUID(), provider, fingerprint, now],
    );
  }
}
