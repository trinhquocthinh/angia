import { budgetMonth } from '@angia/contracts';
import type { AiBudgetDependencies, AiBudgetView } from './aiBudgetPorts.js';

// SPEC-013: trần và mức đã dùng của tháng ngân sách hiện tại (Asia/Ho_Chi_Minh); quyền admin chặn ở presentation.
export async function getAiBudget(deps: AiBudgetDependencies): Promise<AiBudgetView> {
  const month = budgetMonth(deps.now());
  const current = await deps.repository.read(month, deps.defaultMonthlyCapUsd);
  return { month, monthlyCapUsd: current.capUsd, spentThisMonthUsd: current.spentUsd };
}
