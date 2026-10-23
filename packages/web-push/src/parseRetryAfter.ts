/** Đọc tiêu đề Retry-After (số giây hoặc ngày HTTP) thành số giây ≥ 0; không hợp lệ → undefined. */
export function parseRetryAfter(header: string | undefined, now: Date): number | undefined {
  const text = header?.trim();
  if (!text) return undefined;
  if (/^\d+$/.test(text)) return Number(text);
  const at = Date.parse(text);
  if (Number.isNaN(at)) return undefined;
  return Math.max(0, Math.ceil((at - now.getTime()) / 1000));
}
