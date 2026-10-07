import type { DocumentToExtract } from './ExtractionDocument.js';

// FSM BR §3.1: chỉ uploaded → extracting. `extracting` là lần thử lại của pg-boss sau lỗi gọi AI;
// trạng thái khác nghĩa là job trùng hoặc người dùng đã xử lý, không gọi AI nữa.
export function canStartExtraction(status: DocumentToExtract['status']): boolean {
  return status === 'uploaded' || status === 'extracting';
}
