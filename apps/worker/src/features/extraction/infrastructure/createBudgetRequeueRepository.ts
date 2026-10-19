import { EXTRACT_DOCUMENT_QUEUE } from '@angia/contracts';
import type pg from 'pg';
import type { PgBoss } from 'pg-boss';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { BudgetCall, BudgetRequeueRepository } from '../application/ports.js';

// Pool role app NOBYPASSRLS: families không áp RLS nên liệt kê được; chứng từ chỉ đọc/ghi trong withFamilyScope.
// Job gửi cùng transaction đổi trạng thái để không có chứng từ extracting mà thiếu job (hoặc ngược lại).
// SPEC-031: gia đình còn hết trần riêng thì để nguyên awaiting_budget (đầu tháng chưa có dòng → còn trần).
async function familyCapSpent(client: pg.PoolClient, familyId: string, call: BudgetCall): Promise<boolean> {
  const result = await client.query<{ spent: boolean }>(
    `SELECT COALESCE(f.spent_usd, 0) + $3::numeric > COALESCE(c.extraction_cap_usd, $4::numeric) AS spent
     FROM families c LEFT JOIN family_extraction_spend f ON f.family_id = c.id AND f.month = $2
     WHERE c.id = $1`,
    [familyId, call.month, call.estimatedCostUsd, call.defaultFamilyCapUsd],
  );
  return result.rows[0]?.spent === true;
}

// Chuyển một chứng từ awaiting_budget → extracting và gửi job cùng transaction; đã đổi trạng thái thì bỏ qua.
function requeueDocument(pool: pg.Pool, boss: PgBoss, familyId: string, documentId: string) {
  return withFamilyScope(pool, familyId, async (client) => {
    const moved = await client.query(
      `UPDATE source_documents SET status = 'extracting'
       WHERE id = $1 AND family_id = $2 AND status = 'awaiting_budget'`,
      [documentId, familyId],
    );
    if (moved.rowCount !== 1) return false;
    const db = { executeSql: (text: string, values?: unknown[]) => client.query(text, values) };
    const jobId = await boss.send(EXTRACT_DOCUMENT_QUEUE, { documentId, familyId }, { db });
    if (!jobId) throw new Error('Không tạo được việc đọc chứng từ');
    return true;
  });
}

export function createBudgetRequeueRepository(pool: pg.Pool, boss: PgBoss): BudgetRequeueRepository {
  return {
    listFamilyIds: async () =>
      (await pool.query<{ id: string }>('SELECT id FROM families ORDER BY id')).rows.map((row) => row.id),
    // SPEC-031 §4.4: giữ thứ tự created_at — pg-boss lấy job theo created_on (thời điểm transaction), nên mỗi
    // chứng từ một transaction riêng theo thứ tự; trạng thái và job vẫn cùng commit.
    requeueFamily: async (familyId, call) => {
      const ids = await withFamilyScope(pool, familyId, async (client) => {
        if (await familyCapSpent(client, familyId, call)) return [];
        const parked = await client.query<{ id: string }>(
          `SELECT id FROM source_documents WHERE family_id = $1 AND status = 'awaiting_budget' ORDER BY created_at, id`,
          [familyId],
        );
        return parked.rows.map((row) => row.id);
      });
      let requeued = 0;
      for (const id of ids) if (await requeueDocument(pool, boss, familyId, id)) requeued += 1;
      return requeued;
    },
  };
}
