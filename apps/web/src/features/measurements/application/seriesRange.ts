import { mondayOf } from './mondayOf';

export type WeekSpan = 4 | 12 | 26;

const vietnamToday = (now: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

// N tuần gần nhất: từ Thứ Hai của tuần cách đây N − 1 tuần đến hôm nay (giờ Việt Nam).
export function seriesRange(weeks: WeekSpan, now = new Date()): { from: string; to: string } {
  const to = vietnamToday(now);
  return { from: mondayOf(to, weeks - 1), to };
}
