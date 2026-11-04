export function formatDoseTime(iso: string): string {
  const date = new Date(iso);
  const options = { timeZone: 'Asia/Ho_Chi_Minh' };
  const time = new Intl.DateTimeFormat('vi-VN', {
    ...options,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  const day = new Intl.DateTimeFormat('vi-VN', {
    ...options,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  return `${time} · ${day}`;
}
