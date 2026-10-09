import { budgetMonth } from '../domain/budgetMonth.js';
import type { BudgetCall, BudgetPolicy } from './ports.js';

// Chốt tháng ngân sách một lần cho cả lượt xử lý: giữ chỗ và quyết toán cùng tháng dù lời gọi AI vắt qua 00:00.
export function toBudgetCall(policy: BudgetPolicy): BudgetCall {
  return {
    month: budgetMonth(policy.now()),
    estimatedCostUsd: policy.estimatedCostUsd,
    defaultMonthlyCapUsd: policy.defaultMonthlyCapUsd,
  };
}
