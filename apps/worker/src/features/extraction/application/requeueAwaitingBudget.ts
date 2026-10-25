import type { BudgetCall, BudgetRequeueRepository } from './ports.js';

// TC-030/SPEC-009: đầu tháng mới đưa chứng từ awaiting_budget về extracting và enqueue lại; worker kiểm ngân sách
// lần nữa nên chứng từ vượt trần tháng mới quay về awaiting_budget. Mỗi gia đình một withFamilyScope riêng.
// SPEC-031: quản trị nâng trần một gia đình → job kèm familyId chỉ xử lý gia đình đó; repository bỏ qua gia đình
// còn hết trần riêng để không đẩy rồi bật lại awaiting_budget.
export async function requeueAwaitingBudget(
  repository: BudgetRequeueRepository,
  input: { familyId?: string | undefined; call: BudgetCall },
): Promise<{ families: number; requeued: number }> {
  const familyIds = input.familyId ? [input.familyId] : await repository.listFamilyIds();
  let requeued = 0;
  for (const familyId of familyIds) requeued += await repository.requeueFamily(familyId, input.call);
  return { families: familyIds.length, requeued };
}
