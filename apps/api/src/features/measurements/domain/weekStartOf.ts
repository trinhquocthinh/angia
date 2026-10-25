// BR-023: tuần tính từ Thứ Hai đến Chủ Nhật. `measured_on` đã là ngày theo giờ địa phương (Asia/Ho_Chi_Minh)
// nên chỉ cần lịch thuần, không quy đổi múi giờ. Đầu vào ngày YYYY-MM-DD hợp lệ.
export function weekStartOf(date: string): string {
  const day = new Date(`${date}T00:00:00.000Z`);
  const daysSinceMonday = (day.getUTCDay() + 6) % 7;
  day.setUTCDate(day.getUTCDate() - daysSinceMonday);
  return day.toISOString().slice(0, 10);
}
