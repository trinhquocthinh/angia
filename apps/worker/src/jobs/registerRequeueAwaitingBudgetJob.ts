import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import { requeueAwaitingBudget } from '@src/features/extraction/application/requeueAwaitingBudget.js';
import type { BudgetRequeueRepository } from '@src/features/extraction/application/ports.js';

const REQUEUE_AWAITING_BUDGET_QUEUE = 'requeue-awaiting-budget';
// 00:05 ngày 01 hằng tháng giờ Việt Nam (BR-018, chủ dự án chốt 2026-10-09). schedule() upsert, gọi mỗi lần khởi động.
const MONTHLY_CRON = '5 0 1 * *';

export async function registerRequeueAwaitingBudgetJob(
  boss: PgBoss,
  repository: BudgetRequeueRepository,
  logger: Logger,
): Promise<void> {
  await boss.createQueue(REQUEUE_AWAITING_BUDGET_QUEUE, { retryLimit: 3, retryDelay: 60 });
  await boss.schedule(REQUEUE_AWAITING_BUDGET_QUEUE, MONTHLY_CRON, null, { tz: 'Asia/Ho_Chi_Minh' });
  await boss.work(REQUEUE_AWAITING_BUDGET_QUEUE, { batchSize: 1 }, async () => {
    const result = await requeueAwaitingBudget(repository);
    logger.info(result, 'Đã đưa chứng từ awaiting_budget vào lại hàng đợi');
  });
}
