import type { SourceDocument } from './reviewPorts';

const POLL_MS = 3000;

// Ảnh đã lên server nhưng worker chưa đọc xong (SPEC-009).
export const isReading = (document: SourceDocument) =>
  document.status === 'uploaded' || document.status === 'extracting';

// Chỉ hỏi lại khi còn chứng từ đang đọc; không còn thì dừng hẳn (không tốn request).
export function reviewPollInterval(documents: SourceDocument[] | undefined): number | false {
  return documents?.some(isReading) ? POLL_MS : false;
}

export type ReviewItemState = 'reading' | 'ready' | 'later' | 'manual';

// E2-S6-T1 duyệt được số đo máy; đơn thuốc/xét nghiệm và nhập tay (manual_entry) thuộc bản sau.
export function reviewItemState(document: SourceDocument): ReviewItemState {
  if (isReading(document)) return 'reading';
  if (document.status === 'manual_entry') return 'manual';
  return document.type === 'device_reading' ? 'ready' : 'later';
}
