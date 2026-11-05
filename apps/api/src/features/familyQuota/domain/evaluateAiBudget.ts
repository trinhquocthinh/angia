// Cổng OCR: lượt theo gia đình, phí thực và độ tươi theo toàn hệ thống.
export interface AiBudgetSnapshot {
  grantedScans: number;
  usedScans: number;
  heldScans: number;
  billingAvailable: boolean;
  budgetExhausted: boolean;
}
export type OcrGateReason = 'scan_quota_exhausted' | 'budget_exhausted' | 'billing_unavailable';
export function evaluateAiBudget(budget: AiBudgetSnapshot): {
  usedPercent: number;
  anyUsed: boolean;
  exhausted: boolean;
  reason?: OcrGateReason;
} {
  const usedPercent =
    budget.grantedScans <= 0
      ? 0
      : Math.min(100, Math.max(0, Number((BigInt(budget.usedScans) * 100n) / BigInt(budget.grantedScans))));
  const reason: OcrGateReason | undefined = !budget.billingAvailable
    ? 'billing_unavailable'
    : budget.budgetExhausted
      ? 'budget_exhausted'
      : budget.grantedScans - budget.usedScans - budget.heldScans <= 0
        ? 'scan_quota_exhausted'
        : undefined;
  return {
    usedPercent,
    anyUsed: budget.usedScans > 0,
    exhausted: reason !== undefined,
    ...(reason ? { reason } : {}),
  };
}
