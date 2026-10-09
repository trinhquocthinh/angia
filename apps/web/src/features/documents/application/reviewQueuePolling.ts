import type { SourceDocument } from './reviewPorts';

const POLL_MS = 3000;

// Ảnh đã lên server nhưng worker chưa đọc xong (SPEC-009).
export const isReading = (document: SourceDocument) =>
  document.status === 'uploaded' || document.status === 'extracting';

// Chỉ hỏi lại khi còn chứng từ đang đọc; không còn thì dừng hẳn (không tốn request).
export function reviewPollInterval(documents: SourceDocument[] | undefined): number | false {
  return documents?.some(isReading) ? POLL_MS : false;
}

export type ReviewItemState = 'preparing' | 'privacy' | 'reading' | 'ready' | 'manual';

// Duyệt được số đo máy (E2-S6-T1), đơn thuốc (E3-S3-T1) và xét nghiệm (E3-S3-T2); manual_entry mở form nhập tay cạnh ảnh (E3-S4-T1).
export function reviewItemState(document: SourceDocument): ReviewItemState {
  if (document.status === 'uploaded') return 'preparing';
  if (document.status === 'awaiting_privacy') return 'privacy';
  if (isReading(document)) return 'reading';
  if (document.status === 'manual_entry') return 'manual';
  return 'ready';
}
