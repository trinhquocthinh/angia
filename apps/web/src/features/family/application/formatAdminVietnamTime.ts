export function formatAdminVietnamTime(value: string): string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(dateOnly ? {} : { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' as const }),
  }).formatToParts(new Date(dateOnly ? `${value}T00:00:00+07:00` : value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  const date = `${get('day')}/${get('month')}/${get('year')}`;
  return dateOnly ? date : `${date} ${get('hour')}:${get('minute')}`;
}
