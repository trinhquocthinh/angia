import type { components } from '@src/shared/api/schema.gen';
export type UploadBatchResponse = components['schemas']['UploadBatchResponse'];
export type DocumentType = NonNullable<components['schemas']['UploadBatchRequest']['declaredType']>;
export type RejectedFileCode = UploadBatchResponse['rejectedFiles'][number]['code'];
interface UploadRequest {
  profileId: string;
  // Tên tệp multipart do client đặt, duy nhất trong lô, để gắn `rejectedFiles` về đúng ảnh.
  files: Array<{ fileName: string; file: File }>;
  declaredType: DocumentType | null;
  csrfToken: string;
  onProgress(percent: number): void;
}
export interface DocumentUploader {
  upload(request: UploadRequest): Promise<UploadBatchResponse>;
}
// Nén/chuyển định dạng ảnh trước khi gửi; trả chính tệp gốc khi không cần hoặc không xử lý được.
export type ImagePreparer = (file: File) => Promise<File>;
