const DAY_MS = 24 * 60 * 60 * 1000;

// Ngày lịch YYYY-MM-DD (đã là ngày Việt Nam) → Thứ Hai của tuần chứa nó; tính trên UTC để khỏi lệch múi giờ máy.
export function mondayOf(day: string, weeksBack = 0): string {
  const date = new Date(`${day}T00:00:00Z`);
  const offset = (date.getUTCDay() + 6) % 7;
  return new Date(date.getTime() - (offset + weeksBack * 7) * DAY_MS).toISOString().slice(0, 10);
}
