import { USD_SCALE, usdUnits } from './usdUnits.js';
const MIN_OBSERVED_SCANS = 20;
// CP5.5: mức env là sàn; đủ mẫu thì dùng phí thực trung bình (làm tròn lên) nếu cao hơn.
export function effectiveCostPerScan(initialUsd: string, actualSpendUsd: string, usedScans: number): string {
  const initial = usdUnits(initialUsd);
  const used = BigInt(usedScans);
  const observed = usedScans >= MIN_OBSERVED_SCANS ? (usdUnits(actualSpendUsd) + used - 1n) / used : 0n;
  const cost = observed > initial ? observed : initial;
  return `${cost / USD_SCALE}.${(cost % USD_SCALE).toString().padStart(12, '0')}`;
}
