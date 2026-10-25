import type { UploadBatchResponse } from '@angia/contracts';
import type { UploadBatch } from '../domain/SourceDocument.js';
import { toSourceDocumentResponse } from './toSourceDocumentResponse.js';

export function toUploadBatchResponse(batch: UploadBatch): UploadBatchResponse {
  return {
    id: batch.id,
    rejectedFiles: batch.rejectedFiles,
    documents: batch.documents.map(toSourceDocumentResponse),
  };
}
