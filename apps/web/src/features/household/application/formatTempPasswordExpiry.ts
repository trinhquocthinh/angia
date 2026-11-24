/** Định dạng dòng hạn dùng mật khẩu tạm theo múi giờ Việt Nam (SPEC-062). */
export function formatTempPasswordExpiry(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Chỉ hiện một lần. Hết hạn sau 24 giờ.';
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return `Chỉ hiện một lần. Hết hạn lúc ${part('hour')}:${part('minute')} ngày ${part('day')}/${part('month')}/${part('year')}.`;
}
