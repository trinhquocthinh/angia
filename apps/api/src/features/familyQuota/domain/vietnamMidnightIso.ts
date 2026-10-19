const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

// Mốc 00:00 giờ Việt Nam dạng `YYYY-MM-DDT00:00:00+07:00` (đầu vào là 00:00 VN theo UTC) để client hiển thị đúng ngày.
export function vietnamMidnightIso(instant: Date): string {
  const day = new Date(instant.getTime() + VIETNAM_OFFSET_MS).toISOString().slice(0, 10);
  return `${day}T00:00:00+07:00`;
}
