import { formatDay } from './formatMeasurement';
import type { MeasurementKind } from './ports';

const KIND_LABEL: Record<MeasurementKind, string> = {
  blood_pressure: 'Huyết áp',
  glucose: 'Đường huyết',
};

// Câu mô tả cho trình đọc màn hình: chỉ khoảng thời gian và số lượng, không nhận xét biến thiên (BR-033).
export function describeSeries(
  kind: MeasurementKind,
  summary: { from: string; to: string; points: number; emptyWeeks: number },
): string {
  const empty = summary.emptyWeeks > 0 ? `, ${summary.emptyWeeks} tuần chưa đo` : '';
  return `${KIND_LABEL[kind]} từ ${formatDay(summary.from)} đến ${formatDay(summary.to)}: ${summary.points} lần đo${empty}.`;
}
