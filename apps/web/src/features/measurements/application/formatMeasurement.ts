import type { Measurement } from './ports';

// `measuredOn` là ngày lịch (không múi giờ): chỉ đảo thứ tự, không qua Date để khỏi lệch ngày.
export const formatDay = (isoDate: string) => isoDate.split('-').reverse().join('/');

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);

// Đường huyết hiển thị nguyên đơn vị gốc; quy đổi thuộc SPEC-020 (E5).
export function readingText(measurement: Measurement): string {
  if (measurement.kind === 'blood_pressure') return `${measurement.systolic}/${measurement.diastolic} mmHg`;
  return `${formatNumber(measurement.glucoseValue ?? 0)} ${measurement.glucoseUnit ?? ''}`.trim();
}
