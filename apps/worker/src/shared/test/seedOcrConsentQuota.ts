import { randomUUID } from 'node:crypto';
import type pg from 'pg';

// Cấp lượt tường minh trong PostgreSQL test, không thay cổng runtime.
export async function seedOcrConsentQuota(owner: pg.Client, familyId: string, month: string, now: Date) {
  await owner.query(`INSERT INTO scan_quota_policy(id) VALUES (1) ON CONFLICT DO NOTHING`);
  await owner.query(
    `INSERT INTO scan_quota_months(month,committed_remaining_scans) VALUES ($1,2)
    ON CONFLICT (month) DO UPDATE SET committed_remaining_scans=scan_quota_months.committed_remaining_scans+2`,
    [month],
  );
  await owner.query(`INSERT INTO extraction_spend(month,cap_usd) VALUES ($1,5) ON CONFLICT DO NOTHING`, [
    month,
  ]);
  await owner.query(
    `INSERT INTO family_scan_quotas(family_id,month,status,granted_scans,updated_at,updated_by)
    SELECT $1,$2,'approved',2,$3,id FROM accounts WHERE family_id=$1`,
    [familyId, month, now],
  );
  for (const provider of ['openrouter', 'woku'])
    await owner.query(
      `INSERT INTO ai_billing_sources
    (id,provider,credential_fingerprint,status,last_attempt_at,last_complete_at) VALUES ($1,$2,$3,'complete',$4,$4)`,
      [randomUUID(), provider, randomUUID(), now],
    );
}
