import { requeueAwaitingBudgetJobSchema } from '@angia/contracts';
import type { Logger } from 'pino';
import type { BudgetPolicy, BudgetRequeueRepository } from '@src/features/extraction/application/ports.js';
import { requeueAwaitingBudget } from '@src/features/extraction/application/requeueAwaitingBudget.js';
import { toBudgetCall } from '@src/features/extraction/application/toBudgetCall.js';

// Payload rỗng (cron) hoặc { familyId } (quản trị nâng trần, SPEC-031); sai dạng → ném lỗi để pg-boss thử lại.
export function handleRequeueAwaitingBudgetJob(
  repository: BudgetRequeueRepository,
  policy: BudgetPolicy,
  logger: Logger,
) {
  return async (job: { id: string; data: unknown }) => {
    const { familyId } = requeueAwaitingBudgetJobSchema.parse(job.data ?? {});
    const result = await requeueAwaitingBudget(repository, { familyId, call: toBudgetCall(policy) });
    logger.info({ jobId: job.id, ...result }, 'Đã đưa chứng từ awaiting_budget vào lại hàng đợi');
    return result;
  };
}
