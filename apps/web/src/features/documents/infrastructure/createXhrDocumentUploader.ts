import { DocumentUploadError } from '../application/DocumentUploadError';
import type { DocumentUploader, UploadBatchResponse } from '../application/ports';

type XhrFactory = () => XMLHttpRequest;

// Chỉ nhận dạng số giây; dạng HTTP-date hoặc giá trị lạ thì để runUpload dùng mặc định.
function retryAfterSeconds(xhr: XMLHttpRequest): number | undefined {
  const value = xhr.getResponseHeader('Retry-After')?.trim();
  return value && /^\d+$/.test(value) ? Number(value) : undefined;
}

// Gửi cả lô trong một request. openapi-fetch không báo tiến trình tải lên nên dùng XHR; hợp đồng vẫn theo UploadBatchResponse sinh từ OpenAPI.
export function createXhrDocumentUploader(
  createXhr: XhrFactory = () => new XMLHttpRequest(),
): DocumentUploader {
  return {
    upload: (request) =>
      new Promise<UploadBatchResponse>((resolve, reject) => {
        const xhr = createXhr();
        xhr.open('POST', `/api/health-profiles/${encodeURIComponent(request.profileId)}/upload-batches`);
        xhr.withCredentials = true;
        xhr.responseType = 'json';
        xhr.setRequestHeader('X-CSRF-Token', request.csrfToken);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) request.onProgress((event.loaded / event.total) * 100);
        };
        xhr.onload = () => {
          const body = xhr.response as (UploadBatchResponse & { error?: { code?: string } }) | null;
          if (xhr.status === 201 && body) resolve(body);
          else reject(new DocumentUploadError(xhr.status, body?.error?.code, retryAfterSeconds(xhr)));
        };
        xhr.onerror = () => reject(new DocumentUploadError(0));
        const form = new FormData();
        for (const { fileName, file } of request.files) form.append('files', file, fileName);
        if (request.declaredType) form.append('declaredType', request.declaredType);
        xhr.send(form);
      }),
  };
}
