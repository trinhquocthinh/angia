import type { Measurement, SeriesPoint } from './ports';

// `measuredOn` là ngày lịch (không múi giờ): chỉ đảo thứ tự, không qua Date để khỏi lệch ngày.
export const formatDay = (isoDate: string) => isoDate.split('-').reverse().join('/');

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);

// Đường huyết hiển thị nguyên đơn vị gốc; quy đổi thuộc SPEC-020 (E5).
export function readingText(measurement: Measurement): string {
  if (measurement.kind === 'blood_pressure') return `${measurement.systolic}/${measurement.diastolic} mmHg`;
  return `${formatNumber(measurement.glucoseValue ?? 0)} ${measurement.glucoseUnit ?? ''}`.trim();
}

// Điểm chuỗi biểu đồ (SPEC-020): đường huyết theo giá trị đã quy đổi; mmol/L luôn 1 số lẻ.
export function displayReadingText(point: SeriesPoint): string {
  if (point.kind === 'blood_pressure') return readingText(point);
  const digits = point.displayGlucoseUnit === 'mmol/L' ? 1 : 0;
  const value = new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(point.displayGlucoseValue ?? 0);
  return `${value} ${point.displayGlucoseUnit ?? ''}`.trim();
}
