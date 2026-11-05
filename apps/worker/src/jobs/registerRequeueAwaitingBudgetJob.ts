import { REQUEUE_AWAITING_BUDGET_QUEUE, REQUEUE_AWAITING_BUDGET_QUEUE_OPTIONS } from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import type { BudgetPolicy, BudgetRequeueRepository } from '@src/features/extraction/application/ports.js';
import { handleRequeueAwaitingBudgetJob } from './handleRequeueAwaitingBudgetJob.js';

// Mỗi phút kiểm lại quota/phí để phục hồi khi billing hoặc hạn mức đã được quản trị cập nhật.
const RECOVERY_CRON = '* * * * *';

export async function registerRequeueAwaitingBudgetJob(
  boss: PgBoss,
  repository: BudgetRequeueRepository,
  policy: BudgetPolicy,
  logger: Logger,
): Promise<void> {
  await boss.createQueue(REQUEUE_AWAITING_BUDGET_QUEUE, REQUEUE_AWAITING_BUDGET_QUEUE_OPTIONS);
  await boss.schedule(REQUEUE_AWAITING_BUDGET_QUEUE, RECOVERY_CRON, null, { tz: 'Asia/Ho_Chi_Minh' });
  const handle = handleRequeueAwaitingBudgetJob(repository, policy, logger);
  await boss.work(REQUEUE_AWAITING_BUDGET_QUEUE, { batchSize: 1 }, async ([job]) => {
    if (job) await handle(job);
  });
}
