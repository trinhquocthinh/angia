// Quota tài nguyên theo gia đình (BR-043, SPEC-030): ngưỡng, mức đã dùng và phần một thao tác xin thêm.
export interface QuotaLimits {
  storageBytes: number;
  dailyUploads: number;
  pendingJobs: number;
}

export interface UsageCounts {
  storageBytes: number;
  uploadsToday: number;
  pendingJobs: number;
}

export interface QuotaRequest {
  files: number;
  bytes: number;
  jobs: number;
}

type QuotaCode = 'ERR_STORAGE_QUOTA' | 'ERR_DAILY_UPLOAD_QUOTA' | 'ERR_QUEUE_QUOTA';

export interface QuotaFailure {
  ok: false;
  code: QuotaCode;
  details: Record<string, number | string>;
}

export type QuotaResult = { ok: true } | QuotaFailure;

// Kiểm sơ bộ trước khi đọc body: xin thêm 1 ở mọi chiều ⇔ "đã chạm trần nào chưa".
export const PREFLIGHT_REQUEST: QuotaRequest = { files: 1, bytes: 1, jobs: 1 };
// Tạo bản kiểm tra / xác nhận gửi AI chỉ thêm một job worker.
export const ONE_JOB: QuotaRequest = { files: 0, bytes: 0, jobs: 1 };
