import type { DocumentToExtract } from './ExtractionDocument.js';

// BR-041: transaction duyệt riêng tư chuyển sang extracting và enqueue OCR.
// Worker chỉ chạy trạng thái này, kể cả retry; uploaded/awaiting_privacy chưa được gọi AI.
export function canStartExtraction(status: DocumentToExtract['status']): boolean {
  return status === 'extracting';
}
