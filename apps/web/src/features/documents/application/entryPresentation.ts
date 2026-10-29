import type { DocumentEntry } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';

type EntryAction = 'detail' | 'review' | 'none';

// Nhãn trung tính theo Design §E5-S4-T1; không lời nhận định (BR-033).
const STATUS_LABELS: Record<DocumentEntry['status'], string> = {
  approved: 'Đã lưu vào sổ',
  pending_review: 'Chờ duyệt',
  uploaded: 'Đang xử lý',
  extracting: 'Đang xử lý',
  awaiting_budget: 'Đang xử lý',
  manual_entry: 'Cần nhập tay',
  manual_record: 'Nhập tay, không có ảnh',
};
const TITLES = { prescription: 'Đơn thuốc', lab_result: 'Phiếu xét nghiệm', device_reading: 'Ảnh máy đo' };

export const entryStatusLabel = (entry: DocumentEntry) => STATUS_LABELS[entry.status];
export const entryTitle = (entry: DocumentEntry) => (entry.type ? TITLES[entry.type] : 'Chưa phân loại');

export function entryDateLabel(entry: DocumentEntry): string {
  return entry.dateKnown
    ? formatDay(entry.entryDate)
    : `Chưa rõ ngày · tải lên ${formatDay(entry.entryDate)}`;
}

// Đã lưu → ngăn chi tiết; còn chờ người duyệt (kể cả chờ ngân sách AI, mở form nhập tay) → /review/:id.
export function entryAction(entry: DocumentEntry): EntryAction {
  switch (entry.status) {
    case 'approved':
    case 'manual_record':
      return 'detail';
    case 'pending_review':
    case 'manual_entry':
    case 'awaiting_budget':
      return 'review';
    default:
      return 'none';
  }
}
