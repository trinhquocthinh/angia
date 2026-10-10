// BR-026: null biểu thị thời hạn đã được xác định là dài hạn.
// Đầu vào: ngày YYYY-MM-DD hợp lệ; số ngày hữu hạn là số nguyên dương đã kiểm tra.
export function calculateEndDate(startDate: string, durationDays: number | null): string | null {
  if (durationDays === null) return null;

  const endDate = new Date(`${startDate}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() + durationDays - 1);
  return endDate.toISOString().slice(0, 10);
}
