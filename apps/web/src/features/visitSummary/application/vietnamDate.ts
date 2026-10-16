// Ngày lịch Việt Nam (YYYY-MM-DD) của một thời điểm; en-CA cho sẵn định dạng ISO.
export function vietnamDate(moment: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(moment);
}
