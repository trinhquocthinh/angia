import { groupLabSeries } from '@src/features/labResults/domain/groupLabSeries.js';
import type { LabResult } from '@src/features/labResults/domain/LabResult.js';

// BR-034 (chủ dự án chốt 2026-10-16): kết quả mới nhất của từng chỉ số có ngày ≤ to, không chặn đầu from.
// Thứ tự theo SPEC-021: chỉ số có kết quả mới nhất trước, hòa thì theo tên chuẩn hóa.
export function pickLatestLabResults(results: readonly LabResult[], to: string): LabResult[] {
  return groupLabSeries(results.filter((result) => result.resultDate <= to)).map((group) =>
    group.results.at(-1)!,
  );
}
