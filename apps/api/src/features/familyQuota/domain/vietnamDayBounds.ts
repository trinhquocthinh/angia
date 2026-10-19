const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Ngày dương lịch giờ Việt Nam (UTC+7 cố định, như budgetMonth) chứa `now`: [start, end).
export function vietnamDayBounds(now: Date): { start: Date; end: Date } {
  const localMs = now.getTime() + VIETNAM_OFFSET_MS;
  const startMs = Math.floor(localMs / DAY_MS) * DAY_MS - VIETNAM_OFFSET_MS;
  return { start: new Date(startMs), end: new Date(startMs + DAY_MS) };
}
