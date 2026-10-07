import type { components } from '@src/shared/api/schema.gen';
export type UploadBatchResponse = components['schemas']['UploadBatchResponse'];
export type DocumentType = NonNullable<components['schemas']['UploadBatchRequest']['declaredType']>;
interface UploadRequest {
  profileId: string;
  file: File;
  declaredType: DocumentType | null;
  csrfToken: string;
  onProgress(percent: number): void;
}
export interface DocumentUploader {
  upload(request: UploadRequest): Promise<UploadBatchResponse>;
}
