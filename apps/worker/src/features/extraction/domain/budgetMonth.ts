// Việt Nam cố định UTC+7, không có giờ mùa hè (chủ dự án chốt tháng ngân sách theo Asia/Ho_Chi_Minh).
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

// BR-018: khóa tháng dương lịch `YYYY-MM` của bảng extraction_spend.
export function budgetMonth(now: Date): string {
  const local = new Date(now.getTime() + VIETNAM_OFFSET_MS);
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, '0')}`;
}
