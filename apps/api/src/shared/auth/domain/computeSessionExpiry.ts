const SESSION_TTL_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

// Hạn phiên trượt 30 ngày (Tech Spec §5.1): tính lại từ thời điểm đăng nhập hoặc lần dùng gần nhất.
export function computeSessionExpiry(now: Date): Date {
  return new Date(now.getTime() + SESSION_TTL_DAYS * DAY_MS);
}
