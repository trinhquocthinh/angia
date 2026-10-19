// SPEC-031: ảnh chụp ngân sách OCR tháng hiện tại (gồm phần đang giữ chỗ) của gia đình và toàn hệ thống.
export interface AiBudgetSnapshot {
  familySpentUsd: number;
  familyCapUsd: number;
  globalSpentUsd: number;
  globalCapUsd: number;
}

// Gia đình chỉ thấy phần trăm theo trần riêng; "hết" khi lời gọi kế tiếp vượt trần gia đình hoặc trần tổng.
export function evaluateAiBudget(
  budget: AiBudgetSnapshot,
  estimatedCostUsd: number,
): { usedPercent: number; exhausted: boolean } {
  const usedPercent =
    budget.familyCapUsd <= 0
      ? 100
      : Math.min(100, Math.max(0, Math.floor((budget.familySpentUsd / budget.familyCapUsd) * 100 + 1e-9)));
  const exhausted =
    budget.familySpentUsd + estimatedCostUsd > budget.familyCapUsd + 1e-9 ||
    budget.globalSpentUsd + estimatedCostUsd > budget.globalCapUsd + 1e-9;
  return { usedPercent, exhausted };
}
