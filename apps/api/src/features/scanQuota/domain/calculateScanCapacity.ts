import { usdUnits as units } from './usdUnits.js';
interface CapacityInput {
  capUsd: string;
  actualSpendUsd: string;
  estimatedCostPerScanUsd: string;
  reserveBasisPoints: number;
  committedRemainingScans: string;
}
// Dự phòng là phần của trần tháng; giữ mẫu 10000 đến phép chia cuối để không làm tròn lạc quan.
export function calculateScanCapacity(input: CapacityInput) {
  const cap = units(input.capUsd);
  const numerator = cap * BigInt(10000 - input.reserveBasisPoints) - units(input.actualSpendUsd) * 10000n;
  const capacity = numerator > 0n ? numerator / (units(input.estimatedCostPerScanUsd) * 10000n) : 0n;
  const difference = capacity - BigInt(input.committedRemainingScans);
  return {
    availableAdditionalScans: (difference > 0n ? difference : 0n).toString(),
    overAllocatedScans: (difference < 0n ? -difference : 0n).toString(),
  };
}
