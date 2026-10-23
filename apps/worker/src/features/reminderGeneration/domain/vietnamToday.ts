const VIETNAM_OFFSET_MS = 7 * 3600_000;

// Việt Nam không có giờ mùa hè: ngày hiện hành = UTC + 7 giờ, dạng YYYY-MM-DD.
export function vietnamToday(now: Date): string {
  return new Date(now.getTime() + VIETNAM_OFFSET_MS).toISOString().slice(0, 10);
}
