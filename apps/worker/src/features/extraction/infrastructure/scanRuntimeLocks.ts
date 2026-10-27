import type pg from 'pg';
import type { BudgetCall } from '../application/ports.js';
export interface ScanOperation {
  month: string;
  state: 'held' | 'dispatched' | 'released';
  dispatch_attempts: number;
}
// Trước hàm này store đã khóa hồ sơ/chứng từ khi kiểm guard. Admin không khóa hai bảng đó.
// Tất cả worker dùng singleton → các tháng sắp thứ tự → tiền → quota gia đình → operation.
export async function lockScanRuntime(client: pg.PoolClient, familyId: string, id: string, call: BudgetCall) {
  await client.query(
    `SELECT 1 FROM health_profiles WHERE family_id=$2 AND id=(
    SELECT health_profile_id FROM source_documents WHERE id=$1 AND family_id=$2) FOR SHARE`,
    [id, familyId],
  );
  await client.query('SELECT id FROM source_documents WHERE id=$1 AND family_id=$2 FOR UPDATE', [
    id,
    familyId,
  ]);
  await client.query('INSERT INTO scan_quota_policy(id) VALUES (1) ON CONFLICT DO NOTHING');
  await client.query('SELECT id FROM scan_quota_policy WHERE id=1 FOR UPDATE');
  const existing = (
    await client.query<ScanOperation>(
      'SELECT month,state,dispatch_attempts FROM ocr_operations WHERE source_document_id=$1 AND family_id=$2',
      [id, familyId],
    )
  ).rows[0];
  const months = [...new Set([call.month, ...(existing ? [existing.month] : [])])].sort();
  for (const month of months) {
    await client.query('INSERT INTO scan_quota_months(month) VALUES ($1) ON CONFLICT DO NOTHING', [month]);
    await client.query('SELECT month FROM scan_quota_months WHERE month=$1 FOR UPDATE', [month]);
  }
  await client.query(
    `INSERT INTO extraction_spend(month,cap_usd) VALUES ($1,
    COALESCE((SELECT cap_usd FROM extraction_spend ORDER BY month DESC LIMIT 1),$2::numeric)) ON CONFLICT DO NOTHING`,
    [call.month, call.defaultMonthlyCapUsd],
  );
  await client.query('SELECT month FROM extraction_spend WHERE month=$1 FOR UPDATE', [call.month]);
  await client.query(
    `SELECT month FROM family_scan_quotas WHERE family_id=$1 AND month=ANY($2::text[])
    ORDER BY month FOR UPDATE`,
    [familyId, months],
  );
  return existing;
}
