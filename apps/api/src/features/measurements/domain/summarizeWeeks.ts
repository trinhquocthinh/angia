import { weekStartOf } from './weekStartOf.js';

export interface MeasurementWeek {
  weekStart: string;
  hasMeasurement: boolean;
}

// SPEC-020, BR-023: mọi tuần chứa ngày trong [from, to], tăng dần; tuần có ≥ 1 số đo đã duyệt → true.
// `measuredOn` là ngày đo của các số đo trong khoảng; from ≤ to đã được bên gọi kiểm tra.
export function summarizeWeeks(from: string, to: string, measuredOn: readonly string[]): MeasurementWeek[] {
  const measuredWeeks = new Set(measuredOn.map(weekStartOf));
  const weeks: MeasurementWeek[] = [];
  const last = weekStartOf(to);
  const monday = new Date(`${weekStartOf(from)}T00:00:00.000Z`);
  for (let weekStart = weekStartOf(from); weekStart <= last; weekStart = monday.toISOString().slice(0, 10)) {
    weeks.push({ weekStart, hasMeasurement: measuredWeeks.has(weekStart) });
    monday.setUTCDate(monday.getUTCDate() + 7);
  }
  return weeks;
}
