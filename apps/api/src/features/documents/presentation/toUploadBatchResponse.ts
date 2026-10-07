import type { UploadBatchResponse } from '@angia/contracts';
import type { UploadBatch } from '../domain/SourceDocument.js';

export function toUploadBatchResponse(batch: UploadBatch): UploadBatchResponse {
  return {
    id: batch.id,
    rejectedFiles: batch.rejectedFiles,
    documents: batch.documents.map((document) => ({
      id: document.id,
      healthProfileId: document.healthProfileId,
      batchId: document.batchId,
      type: document.type,
      status: document.status,
      documentDate: document.documentDate,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      createdAt: document.createdAt.toISOString(),
    })),
  };
}
