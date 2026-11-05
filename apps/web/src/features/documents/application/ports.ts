import type { FamilyUsage } from '@angia/contracts';
import type { components } from '@src/shared/api/schema.gen';
export type UploadBatchResponse = components['schemas']['UploadBatchResponse'];
export type DocumentType = NonNullable<components['schemas']['UploadBatchRequest']['declaredType']>;
export type RejectedFileCode = UploadBatchResponse['rejectedFiles'][number]['code'];
interface UploadRequest {
  profileId: string;
  // Tên tệp multipart do client đặt, duy nhất trong lô, để gắn `rejectedFiles` về đúng ảnh.
  // sendToAi theo từng tệp: thiếu hoặc false = tự nhập, không bao giờ ngầm gửi AI.
  files: Array<{ fileName: string; file: File; sendToAi: boolean }>;
  declaredType: DocumentType | null;
  csrfToken: string;
  onProgress(percent: number): void;
}
export interface DocumentUploader {
  upload(request: UploadRequest): Promise<UploadBatchResponse>;
}
export interface FamilyUsageRepository {
  get(signal?: AbortSignal): Promise<FamilyUsage>;
}
