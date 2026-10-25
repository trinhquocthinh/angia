import type { SourceDocument as SourceDocumentResponse } from '@angia/contracts';
import type { SourceDocument } from '../domain/SourceDocument.js';

// Không trả khóa S3 (originalKey/previewKey): ảnh chỉ đọc qua route stream có kiểm tra gia đình.
export function toSourceDocumentResponse(document: SourceDocument): SourceDocumentResponse {
  return {
    id: document.id,
    healthProfileId: document.healthProfileId,
    batchId: document.batchId,
    type: document.type,
    status: document.status,
    documentDate: document.documentDate,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    createdAt: document.createdAt.toISOString(),
  };
}
