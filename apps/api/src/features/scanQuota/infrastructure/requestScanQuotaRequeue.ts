import { REQUEUE_AWAITING_BUDGET_QUEUE } from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import { toPgBossDb } from '@src/shared/queue/toPgBossDb.js';
import type { QuotaTx } from './quotaTypes.js';
// Cấp lượt và đánh thức hàng chờ cùng commit; queue lỗi thì toàn bộ cấp phát rollback.
export async function requestScanQuotaRequeue(tx: QuotaTx, boss: PgBoss, familyIds: string[]): Promise<void> {
  for (const familyId of familyIds) {
    const job = await boss.send(REQUEUE_AWAITING_BUDGET_QUEUE, { familyId }, { db: toPgBossDb(tx) });
    if (!job) throw new Error('Không tạo được việc đưa chứng từ chờ vào lại hàng đợi');
  }
}
