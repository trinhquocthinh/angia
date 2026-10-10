import type { BudgetRequeueRepository } from './ports.js';

// TC-030/SPEC-009: đầu tháng mới đưa chứng từ awaiting_budget về extracting và enqueue lại; worker kiểm ngân sách
// lần nữa nên chứng từ vượt trần tháng mới quay về awaiting_budget. Mỗi gia đình một withFamilyScope riêng.
export async function requeueAwaitingBudget(
  repository: BudgetRequeueRepository,
): Promise<{ families: number; requeued: number }> {
  const familyIds = await repository.listFamilyIds();
  let requeued = 0;
  for (const familyId of familyIds) requeued += await repository.requeueFamily(familyId);
  return { families: familyIds.length, requeued };
}
