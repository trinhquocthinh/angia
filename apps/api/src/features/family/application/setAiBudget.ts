import { budgetMonth } from '@angia/contracts';
import type { AiBudgetDependencies, AiBudgetView } from './aiBudgetPorts.js';

// SPEC-013/BR-018: ghi trần của tháng hiện tại. Hạ trần không cần làm gì thêm — lần giữ chỗ kế tiếp của worker
// tự thất bại → awaiting_budget. Nâng trần thì đưa chứng từ awaiting_budget vào lại hàng đợi ngay
// (chủ dự án chốt 2026-10-10); hết ngân sách giữa chừng thì worker lại chuyển về awaiting_budget.
export async function setAiBudget(
  deps: AiBudgetDependencies,
  input: { monthlyCapUsd: number },
): Promise<AiBudgetView> {
  const month = budgetMonth(deps.now());
  return deps.repository.inTransaction(async (store) => {
    const current = await store.lockMonth(month, deps.defaultMonthlyCapUsd);
    await store.setCap(month, input.monthlyCapUsd);
    if (input.monthlyCapUsd > current.capUsd) await store.requestRequeue();
    return { month, monthlyCapUsd: input.monthlyCapUsd, spentThisMonthUsd: current.spentUsd };
  });
}
