import type { ScanQuotaPolicy } from '@angia/contracts';
// CP5.5: số USD cần nâng trần để đủ `scans` lượt sau dự phòng, làm tròn lên 0,01; chỉ để hiển thị.
export function requiredCapIncreaseUsd(policy: ScanQuotaPolicy, scans: number): string {
  const usd = (scans * Number(policy.estimatedCostPerScanUsd)) / (1 - policy.reserveBasisPoints / 10000);
  return (Math.ceil(usd * 100) / 100).toFixed(2);
}
