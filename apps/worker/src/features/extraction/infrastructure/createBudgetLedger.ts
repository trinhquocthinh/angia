import type pg from 'pg';
import type { BudgetCall, ExtractionStore } from '../application/ports.js';
import { adjustFamily, ensureFamilyMonth, reserveFamily } from './familySpendSql.js';

// Tháng mới chép trần của tháng gần nhất; chưa có tháng nào thì lấy AI_DEFAULT_MONTHLY_CAP_USD (BR-018).
const ENSURE_MONTH = `INSERT INTO extraction_spend (month, cap_usd)
  VALUES ($1, COALESCE((SELECT cap_usd FROM extraction_spend ORDER BY month DESC LIMIT 1), $2::numeric))
  ON CONFLICT (month) DO NOTHING`;

// Chạy trong transaction withFamilyScope đang khóa FOR UPDATE chứng từ (Tech Spec §3, F03a; SPEC-031 thêm trần gia đình).
// UPDATE có điều kiện khóa dòng tháng nên nhiều worker giữ chỗ đồng thời vẫn không vượt trần.
export function createBudgetLedger(
  client: pg.PoolClient,
  familyId: string,
): Pick<ExtractionStore, 'reserveBudget' | 'settleBudget'> {
  const ensureMonth = (call: BudgetCall) =>
    client.query(ENSURE_MONTH, [call.month, call.defaultMonthlyCapUsd]);
  return {
    reserveBudget: async (id, call) => {
      const held = await client.query(`SELECT 1 FROM extraction_reservations WHERE source_document_id = $1`, [
        id,
      ]);
      if (held.rowCount) return true;
      await ensureMonth(call);
      await ensureFamilyMonth(client, familyId, call.month);
      // Thứ tự khóa cố định: dòng gia đình rồi dòng tổng (SPEC-031) — không có vòng chờ giữa các worker.
      if (!(await reserveFamily(client, familyId, call))) return false;
      const reserved = await client.query(
        `UPDATE extraction_spend SET spent_usd = spent_usd + $2::numeric, updated_at = now()
         WHERE month = $1 AND spent_usd + $2::numeric <= cap_usd`,
        [call.month, call.estimatedCostUsd],
      );
      if (reserved.rowCount !== 1) {
        await adjustFamily(client, familyId, call.month, -call.estimatedCostUsd);
        return false;
      }
      await client.query(
        `INSERT INTO extraction_reservations (source_document_id, family_id, month, amount_usd)
         VALUES ($1, $2, $3, $4)`,
        [id, familyId, call.month, call.estimatedCostUsd],
      );
      return true;
    },
    settleBudget: async (id, costUsd, call) => {
      const released = await client.query<{ month: string; amount_usd: string }>(
        `DELETE FROM extraction_reservations WHERE source_document_id = $1 RETURNING month, amount_usd`,
        [id],
      );
      const reservation = released.rows[0];
      if (!reservation && costUsd <= 0) return;
      if (!reservation) {
        await ensureMonth(call);
        await ensureFamilyMonth(client, familyId, call.month);
      }
      const month = reservation?.month ?? call.month;
      const delta = costUsd - Number(reservation?.amount_usd ?? 0);
      await adjustFamily(client, familyId, month, delta);
      await client.query(
        `UPDATE extraction_spend SET spent_usd = spent_usd + $2::numeric - $3::numeric, updated_at = now()
         WHERE month = $1`,
        [reservation?.month ?? call.month, costUsd, reservation?.amount_usd ?? 0],
      );
    },
  };
}
