import { EXTRACT_DOCUMENT_QUEUE } from '@angia/contracts';
import type pg from 'pg';
import type { PgBoss } from 'pg-boss';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { BudgetRequeueRepository } from '../application/ports.js';

// Pool role app NOBYPASSRLS: families không áp RLS nên liệt kê được; chứng từ chỉ đọc/ghi trong withFamilyScope.
// Job gửi cùng transaction đổi trạng thái để không có chứng từ extracting mà thiếu job (hoặc ngược lại).
export function createBudgetRequeueRepository(pool: pg.Pool, boss: PgBoss): BudgetRequeueRepository {
  return {
    listFamilyIds: async () =>
      (await pool.query<{ id: string }>('SELECT id FROM families ORDER BY id')).rows.map((row) => row.id),
    requeueFamily: (familyId) =>
      withFamilyScope(pool, familyId, async (client) => {
        const moved = await client.query<{ id: string }>(
          `UPDATE source_documents SET status = 'extracting'
           WHERE family_id = $1 AND status = 'awaiting_budget' RETURNING id`,
          [familyId],
        );
        const db = { executeSql: (text: string, values?: unknown[]) => client.query(text, values) };
        for (const { id } of moved.rows) {
          const jobId = await boss.send(EXTRACT_DOCUMENT_QUEUE, { documentId: id, familyId }, { db });
          if (!jobId) throw new Error('Không tạo được việc đọc chứng từ');
        }
        return moved.rows.length;
      }),
  };
}
