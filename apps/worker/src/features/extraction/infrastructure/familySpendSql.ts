import type pg from 'pg';
import type { BudgetCall } from '../application/ports.js';

// SPEC-031: dòng chi phí OCR của gia đình trong tháng (cần dòng extraction_spend của tháng trước — FK).
export const ensureFamilyMonth = (client: pg.PoolClient, familyId: string, month: string) =>
  client.query(
    `INSERT INTO family_extraction_spend (family_id, month) VALUES ($1, $2) ON CONFLICT (family_id, month) DO NOTHING`,
    [familyId, month],
  );

// Giữ chỗ nguyên tử trên trần gia đình (cột riêng hoặc mặc định env); UPDATE có điều kiện khóa dòng gia đình.
export async function reserveFamily(
  client: pg.PoolClient,
  familyId: string,
  call: BudgetCall,
): Promise<boolean> {
  const reserved = await client.query(
    `UPDATE family_extraction_spend f SET spent_usd = f.spent_usd + $3::numeric, updated_at = now()
     FROM families c
     WHERE f.family_id = $1 AND f.month = $2 AND c.id = f.family_id
       AND f.spent_usd + $3::numeric <= COALESCE(c.extraction_cap_usd, $4::numeric)`,
    [familyId, call.month, call.estimatedCostUsd, call.defaultFamilyCapUsd],
  );
  return reserved.rowCount === 1;
}

// Cộng/trừ chi phí vào dòng gia đình (quyết toán, trả chỗ, bù trừ khi trần tổng hết); không âm nhờ CHECK.
export const adjustFamily = (
  client: pg.PoolClient,
  familyId: string,
  month: string,
  deltaUsd: string | number,
) =>
  client.query(
    `UPDATE family_extraction_spend SET spent_usd = spent_usd + $3::numeric, updated_at = now()
     WHERE family_id = $1 AND month = $2`,
    [familyId, month, deltaUsd],
  );
