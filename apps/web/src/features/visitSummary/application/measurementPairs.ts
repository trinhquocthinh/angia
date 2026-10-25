import type { SummaryMeasurementRow } from './measurementRows';

export type MeasurementPair = [SummaryMeasurementRow, SummaryMeasurementRow | null];

// Chế độ nén (owner chốt E6-S1-T2): một bảng, mỗi dòng 2 thời điểm liên tiếp đọc trái → phải. Bảng ngắt trang
// giữa các dòng ở bất kỳ đâu (cột báo chí bị trình duyệt đẩy cả khối sang trang sau khi cân bằng cột).
export function measurementPairs(rows: readonly SummaryMeasurementRow[]): MeasurementPair[] {
  return Array.from({ length: Math.ceil(rows.length / 2) }, (_, index) => [
    rows[index * 2]!,
    rows[index * 2 + 1] ?? null,
  ]);
}
