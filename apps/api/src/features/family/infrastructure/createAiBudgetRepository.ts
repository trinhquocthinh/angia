import { REQUEUE_AWAITING_BUDGET_QUEUE } from '@angia/contracts';
import { sql } from 'drizzle-orm';
import type { PgBoss } from 'pg-boss';
import type { Database } from '@src/shared/db/createDatabase.js';
import { toPgBossDb } from '@src/shared/queue/toPgBossDb.js';
import type { AiBudgetMonth, AiBudgetRepository } from '../application/aiBudgetPorts.js';

type BudgetRow = { cap_usd: string; spent_usd: string };

const toMonth = (row: BudgetRow | undefined): AiBudgetMonth => {
  if (!row) throw new Error('extraction_spend không trả về dòng nào');
  return { capUsd: Number(row.cap_usd), spentUsd: Number(row.spent_usd) };
};

// Cùng quy tắc tháng mới của worker (createBudgetLedger): chép trần tháng gần nhất, chưa có thì mặc định.
const latestCap = (defaultCapUsd: number) =>
  sql`COALESCE((SELECT cap_usd FROM extraction_spend ORDER BY month DESC LIMIT 1), ${defaultCapUsd}::numeric)`;

// Role app chạy thẳng (extraction_spend không áp RLS). Khóa dòng tháng để không ghi đè lẫn với worker đang giữ chỗ.
export function createAiBudgetRepository(db: Database, boss: PgBoss): AiBudgetRepository {
  return {
    read: async (month, defaultCapUsd) => {
      const result = await db.execute<BudgetRow>(sql`
        SELECT COALESCE((SELECT cap_usd FROM extraction_spend WHERE month = ${month}), ${latestCap(defaultCapUsd)}) AS cap_usd,
               COALESCE((SELECT spent_usd FROM extraction_spend WHERE month = ${month}), 0) AS spent_usd`);
      return toMonth(result.rows[0]);
    },
    inTransaction: (work) =>
      db.transaction((tx) =>
        work({
          lockMonth: async (month, defaultCapUsd) => {
            await tx.execute(sql`INSERT INTO extraction_spend (month, cap_usd)
              VALUES (${month}, ${latestCap(defaultCapUsd)}) ON CONFLICT (month) DO NOTHING`);
            const result = await tx.execute<BudgetRow>(
              sql`SELECT cap_usd, spent_usd FROM extraction_spend WHERE month = ${month} FOR UPDATE`,
            );
            return toMonth(result.rows[0]);
          },
          setCap: async (month, capUsd) => {
            await tx.execute(
              sql`UPDATE extraction_spend SET cap_usd = ${capUsd}, updated_at = now() WHERE month = ${month}`,
            );
          },
          requestRequeue: async () => {
            const jobId = await boss.send(REQUEUE_AWAITING_BUDGET_QUEUE, {}, { db: toPgBossDb(tx) });
            if (!jobId) throw new Error('Không tạo được việc đưa chứng từ chờ ngân sách vào lại hàng đợi');
          },
        }),
      ),
  };
}
