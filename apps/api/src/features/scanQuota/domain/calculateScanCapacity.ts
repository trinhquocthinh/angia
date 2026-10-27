interface CapacityInput {
  capUsd: string;
  actualSpendUsd: string;
  estimatedCostPerScanUsd: string;
  reserveBasisPoints: number;
  committedRemainingScans: string;
}
const units = (value: string): bigint => {
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole!) * 1_000_000_000_000n + BigInt(fraction.padEnd(12, '0'));
};
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
