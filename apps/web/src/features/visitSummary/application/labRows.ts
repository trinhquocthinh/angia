import type { LabResult } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';

export interface SummaryLabRow {
  id: string;
  testName: string;
  date: string;
  result: string;
  referenceRange: string;
}

// "Xét nghiệm gần nhất": giữ thứ tự API (chỉ số có kết quả mới nhất trước), giá trị nguyên văn phiếu,
// khoảng tham chiếu in trên phiếu; không tô màu hay nhãn so sánh (BR-022, BR-033).
export function labRows(results: readonly LabResult[]): SummaryLabRow[] {
  return results.map((result) => ({
    id: result.id,
    testName: result.testName,
    date: formatDay(result.resultDate),
    result: result.unit ? `${result.value} ${result.unit}` : result.value,
    referenceRange: result.referenceRange ?? '—',
  }));
}
