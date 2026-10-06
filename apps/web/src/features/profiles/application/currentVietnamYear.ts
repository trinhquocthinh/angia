export function currentVietnamYear(now = new Date()): number {
  return Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).format(now));
}
