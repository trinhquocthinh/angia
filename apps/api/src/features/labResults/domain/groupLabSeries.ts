import { normalizeName } from '@src/features/prescriptions/domain/normalizeName.js';
import type { LabResult } from './LabResult.js';

export interface LabSeriesGroup {
  testName: string;
  results: LabResult[];
}

const byChronology = (a: LabResult, b: LabResult) =>
  a.resultDate.localeCompare(b.resultDate) ||
  a.createdAt.getTime() - b.createdAt.getTime() ||
  a.id.localeCompare(b.id);

// SPEC-021: gom theo tên chuẩn hóa, kết quả cũ nhất trước, giữ nguyên văn từng kết quả (BR-022).
// Tên nhóm là tên nguyên văn lần mới nhất; nhóm có kết quả mới nhất trước, hòa thì theo tên chuẩn hóa A→Z.
export function groupLabSeries(results: LabResult[]): LabSeriesGroup[] {
  const groups = new Map<string, LabResult[]>();
  for (const result of [...results].sort(byChronology)) {
    const key = normalizeName(result.testName);
    groups.set(key, [...(groups.get(key) ?? []), result]);
  }
  return [...groups.entries()]
    .map(([key, items]) => ({ key, latest: items.at(-1)!, items }))
    .sort((a, b) => b.latest.resultDate.localeCompare(a.latest.resultDate) || a.key.localeCompare(b.key))
    .map(({ latest, items }) => ({ testName: latest.testName, results: items }));
}
