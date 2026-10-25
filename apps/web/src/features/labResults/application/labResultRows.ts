import type { LabResult } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { compareToPrintedRange, type RangeFlag } from './compareToPrintedRange';

export interface LabResultRow {
  id: string;
  date: string;
  value: string;
  unit: string | null;
  referenceRange: string;
  source: string;
  rangeFlag: RangeFlag;
}

const sourceLabel = (result: LabResult) =>
  result.facility ?? (result.sourceDocumentId === null ? 'Nhập tay' : 'Từ phiếu xét nghiệm');

// API trả cũ nhất trước; thẻ hiện lần mới nhất trên cùng. Giữ nguyên văn phiếu (BR-022); chỉ đánh dấu
// trung tính khi giá trị ngoài khoảng in trên phiếu, không nhận định (BR-033 làm rõ 2026-10-25).
export function labResultRows(results: LabResult[]): LabResultRow[] {
  return [...results].reverse().map((result) => ({
    id: result.id,
    date: formatDay(result.resultDate),
    value: result.value,
    unit: result.unit,
    referenceRange:
      result.referenceRange === null
        ? 'Phiếu không in khoảng tham chiếu'
        : `Khoảng tham chiếu trên phiếu: ${result.referenceRange}`,
    source: sourceLabel(result),
    rangeFlag: compareToPrintedRange(result.value, result.referenceRange, result.unit),
  }));
}
