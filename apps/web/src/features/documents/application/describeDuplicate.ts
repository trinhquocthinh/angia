import type { ApproveDocumentRequest } from './reviewPorts';
import type { DuplicateRecord } from './ReviewRequestError';

const TYPE_LABELS: Record<ApproveDocumentRequest['type'], string> = {
  prescription: 'đơn thuốc',
  lab_result: 'phiếu xét nghiệm',
  device_reading: 'số đo',
};
const vietnamDate = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
// Ngày chứng từ là ngày lịch (YYYY-MM-DD), không đổi múi giờ.
const calendarDate = (date: string) => date.split('-').reverse().join('/');

// Design §6: "đơn thuốc ngày 01/10/2026, BV…, lưu hôm 02/10/2026" — chỉ mô tả, không đánh giá nội dung.
export function describeDuplicate(duplicate: DuplicateRecord, type: ApproveDocumentRequest['type']): string {
  const source = duplicate.duplicateOf === null ? 'nhập tay' : duplicate.facility;
  return [
    `${TYPE_LABELS[type]} ngày ${calendarDate(duplicate.recordDate)}`,
    ...(source ? [source] : []),
    `lưu hôm ${vietnamDate.format(new Date(duplicate.savedAt))}`,
  ].join(', ');
}
