import { normalizeMedicationName } from './normalizeMedicationName';
import type { AdherencePeriod } from './ports';

export interface MedicationPeriods {
  /** Tên chuẩn hóa — khóa so khớp cùng thuốc như API. */
  key: string;
  /** Tên nguyên văn của lần ghi nhận mới nhất. */
  name: string;
  /** Mốc tăng dần. */
  periods: AdherencePeriod[];
}

export function groupByMedication(periods: AdherencePeriod[]): MedicationPeriods[] {
  const groups = new Map<string, AdherencePeriod[]>();
  for (const period of periods) {
    const key = normalizeMedicationName(period.medicationName);
    groups.set(key, [...(groups.get(key) ?? []), period]);
  }
  return [...groups.entries()]
    .map(([key, items]) => {
      const sorted = [...items].sort((a, b) => a.fromDate.localeCompare(b.fromDate));
      return { key, name: sorted.at(-1)!.medicationName.trim(), periods: sorted };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}

const latestFrom = (group: MedicationPeriods) => group.periods.at(-1)!.fromDate;

// Mặc định tô nền theo thuốc có mốc ghi nhận mới nhất (owner chốt E5-S3-T2: mỗi lần một thuốc).
export function pickDefaultMedication(groups: MedicationPeriods[]): string | null {
  const latest = groups.reduce<MedicationPeriods | null>(
    (best, group) => (!best || latestFrom(group) > latestFrom(best) ? group : best),
    null,
  );
  return latest?.key ?? null;
}
