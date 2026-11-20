function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatHouseholdDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function formatRemainingDuration(iso: string, now = new Date()): string {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return '0 giờ 0 phút';
  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const totalMinutes = Math.ceil(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} giờ ${minutes} phút`;
}
