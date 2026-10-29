import type { DocumentToExtract } from './ExtractionDocument.js';

// BR-041: sanitize chuyển sang extracting và enqueue OCR khi có đồng ý gửi AI.
// Worker chỉ chạy trạng thái này, kể cả retry; uploaded chưa được gọi AI.
export function canStartExtraction(status: DocumentToExtract['status']): boolean {
  return status === 'extracting';
}
