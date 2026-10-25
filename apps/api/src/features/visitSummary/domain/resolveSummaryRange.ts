const DEFAULT_MONTHS = 3;
const MAX_SUMMARY_DAYS = 366;
const DAY_MS = 86_400_000;

type RangeOutcome = { ok: true; value: { from: string; to: string } } | { ok: false; code: 'ERR_VALIDATION' };

// Lùi n tháng lịch; ngày không tồn tại ở tháng đích (31/5 → 2) lấy ngày cuối tháng đó.
function minusMonths(date: string, months: number): string {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  const target = new Date(Date.UTC(year, month - 1 - months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

// SPEC-024 (chủ dự án chốt 2026-10-16): mặc định to = hôm nay (Việt Nam), from = to lùi 3 tháng;
// thiếu một đầu thì suy từ đầu kia; from ≤ to ≤ hôm nay, tối đa 366 ngày tính cả hai đầu.
export function resolveSummaryRange(
  today: string,
  range: { from?: string | undefined; to?: string | undefined },
): RangeOutcome {
  const to = range.to ?? today;
  const from = range.from ?? minusMonths(to, DEFAULT_MONTHS);
  const days = (Date.parse(to) - Date.parse(from)) / DAY_MS + 1;
  if (to > today || from > to || days > MAX_SUMMARY_DAYS) return { ok: false, code: 'ERR_VALIDATION' };
  return { ok: true, value: { from, to } };
}
