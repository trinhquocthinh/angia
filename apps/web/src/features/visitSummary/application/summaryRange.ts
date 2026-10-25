export type SummaryMonths = 1 | 3 | 6;

export interface SummaryRange {
  from: string;
  to: string;
}

const pad = (value: number) => String(value).padStart(2, '0');

// Cùng quy tắc API (SPEC-024): lùi N tháng lịch từ hôm nay; ngày không tồn tại → ngày cuối tháng.
export function summaryRange(months: SummaryMonths, today: string): SummaryRange {
  const [year, month, day] = today.split('-').map(Number) as [number, number, number];
  const target = new Date(Date.UTC(year, month - 1 - months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const from = `${target.getUTCFullYear()}-${pad(target.getUTCMonth() + 1)}-${pad(Math.min(day, lastDay))}`;
  return { from, to: today };
}
