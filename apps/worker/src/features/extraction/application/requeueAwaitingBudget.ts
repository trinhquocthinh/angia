import type { BudgetCall, BudgetRequeueRepository } from './ports.js';

// Quét lại khi cổng có thể đã mở; không cấp quota tự động. Mỗi gia đình có withFamilyScope riêng.
export async function requeueAwaitingBudget(
  repository: BudgetRequeueRepository,
  input: { familyId?: string | undefined; call: BudgetCall },
): Promise<{ families: number; requeued: number }> {
  const familyIds = input.familyId ? [input.familyId] : await repository.listFamilyIds();
  let requeued = 0;
  for (const familyId of familyIds) requeued += await repository.requeueFamily(familyId, input.call);
  return { families: familyIds.length, requeued };
}
