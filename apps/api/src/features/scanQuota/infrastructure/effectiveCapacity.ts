import { calculateScanCapacity } from '../domain/calculateScanCapacity.js';
import { effectiveCostPerScan } from '../domain/effectiveCostPerScan.js';
import type { QuotaState } from './quotaTypes.js';
// CP5.5: chính sách env với chi phí/lượt hiệu dụng; chưa có phí thực thì không tính sức chứa.
export function effectiveCapacity(
  state: QuotaState,
  billing: { monthlyCapUsd: string; actualSpendUsd: string | null },
) {
  const policy = state.policy && {
    ...state.policy,
    estimatedCostPerScanUsd: effectiveCostPerScan(
      state.policy.estimatedCostPerScanUsd,
      billing.actualSpendUsd ?? '0',
      state.usedScans,
    ),
  };
  const capacity =
    policy && billing.actualSpendUsd !== null
      ? calculateScanCapacity({
          capUsd: billing.monthlyCapUsd,
          actualSpendUsd: billing.actualSpendUsd,
          ...policy,
          committedRemainingScans: state.committed,
        })
      : null;
  return { policy, capacity };
}
