import type { LabResult } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';

export interface LabResultRow {
  id: string;
  date: string;
  value: string;
  unit: string | null;
  referenceRange: string;
  source: string;
}

const sourceLabel = (result: LabResult) =>
  result.facility ?? (result.sourceDocumentId === null ? 'Nhập tay' : 'Từ phiếu xét nghiệm');

// API trả cũ nhất trước; thẻ hiện lần mới nhất trên cùng. Giữ nguyên văn phiếu, không nhận định (BR-022, BR-033).
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
  }));
}
