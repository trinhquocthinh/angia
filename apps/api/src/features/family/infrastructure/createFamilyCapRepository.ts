import { REQUEUE_AWAITING_BUDGET_QUEUE } from '@angia/contracts';
import { sql } from 'drizzle-orm';
import type { PgBoss } from 'pg-boss';
import type { Database } from '@src/shared/db/createDatabase.js';
import { type FamilyScopedTx, withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { toPgBossDb } from '@src/shared/queue/toPgBossDb.js';
import type { FamilyCapRepository } from '../application/familyCapPorts.js';

const readSpent = async (tx: FamilyScopedTx, familyId: string, month: string) => {
  const result = await tx.execute<{ spent_usd: string }>(
    sql`SELECT spent_usd FROM family_extraction_spend WHERE family_id = ${familyId} AND month = ${month}`,
  );
  return Number(result.rows[0]?.spent_usd ?? 0);
};

// families không áp RLS (liệt kê được bằng role app); family_extraction_spend chịu RLS nên đọc trong
// withFamilyScope từng gia đình — không dùng role owner (Review Focus 5).
export function createFamilyCapRepository(db: Database, boss: PgBoss): FamilyCapRepository {
  return {
    list: async (month) => {
      const families = await db.execute<{ id: string; name: string; extraction_cap_usd: string | null }>(
        sql`SELECT id, name, extraction_cap_usd FROM families ORDER BY created_at, id`,
      );
      const rows = [];
      for (const family of families.rows) {
        const spentUsd = await withFamilyScope(db, family.id, (tx) => readSpent(tx, family.id, month));
        const capUsd = family.extraction_cap_usd === null ? null : Number(family.extraction_cap_usd);
        rows.push({ familyId: family.id, familyName: family.name, capUsd, spentUsd });
      }
      return rows;
    },
    inTransaction: (familyId, work) =>
      withFamilyScope(db, familyId, (tx) =>
        work({
          lockFamily: async (id) => {
            const result = await tx.execute<{ name: string; extraction_cap_usd: string | null }>(
              sql`SELECT name, extraction_cap_usd FROM families WHERE id = ${id} FOR UPDATE`,
            );
            const row = result.rows[0];
            if (!row) return null;
            return {
              familyName: row.name,
              capUsd: row.extraction_cap_usd === null ? null : Number(row.extraction_cap_usd),
            };
          },
          readSpent: (id, month) => readSpent(tx, id, month),
          setCap: async (id, capUsd) => {
            await tx.execute(sql`UPDATE families SET extraction_cap_usd = ${capUsd} WHERE id = ${id}`);
          },
          requestRequeue: async (id) => {
            const jobId = await boss.send(
              REQUEUE_AWAITING_BUDGET_QUEUE,
              { familyId: id },
              { db: toPgBossDb(tx) },
            );
            if (!jobId) throw new Error('Không tạo được việc đưa chứng từ chờ ngân sách vào lại hàng đợi');
          },
        }),
      ),
  };
}
