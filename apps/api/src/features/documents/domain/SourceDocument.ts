export type DocumentType = 'prescription' | 'lab_result' | 'device_reading';
export type DocumentStatus =
  'uploaded' | 'extracting' | 'pending_review' | 'approved' | 'rejected' | 'manual_entry' | 'awaiting_budget';

// Ngưỡng dung lượng một tệp: 10 MiB, chủ dự án hạ từ 15 MB (2026-10-06).
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
// Trần lô tải lên: chủ dự án hạ 50 → 20 (2026-10-07, E3-S1-T1) → 10 tệp/lần sau thử tải đồng thời
// 20 người × 20 tệp có dấu hiệu quá tải và khảo sát không ai tải 20 tệp một lần.
export const MAX_FILES_PER_UPLOAD = 10;

export interface SourceDocument {
  id: string;
  familyId: string;
  healthProfileId: string;
  batchId: string;
  type: DocumentType | null;
  status: DocumentStatus;
  documentDate: string | null;
  originalKey: string;
  previewKey: string | null;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}

export interface NewSourceDocument {
  id: string;
  healthProfileId: string;
  batchId: string;
  type: DocumentType | null;
  originalKey: string;
  mimeType: string;
  sizeBytes: number;
}

// Tệp đã nhận xong nhưng không nạp vào bộ nhớ: phần đầu đủ để nhận diện magic bytes,
// nội dung mở thành luồng khi lưu để lô 20 tệp không chiếm 200 MiB RAM.
export interface UploadedFile {
  fileName: string;
  sizeBytes: number;
  head: Uint8Array;
  open(): ReadableStream<Uint8Array>;
}

export type FileRejectionCode = 'ERR_UNSUPPORTED_FILE' | 'ERR_FILE_TOO_LARGE';

export interface UploadBatch {
  id: string;
  documents: SourceDocument[];
  rejectedFiles: { fileName: string; code: FileRejectionCode }[];
}

type DocumentError =
  'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' | 'ERR_BATCH_TOO_LARGE' | 'ERR_NO_VALID_FILE' | 'ERR_VALIDATION';
export type DocumentOutcome<T> = { ok: true; value: T } | { ok: false; code: DocumentError };
