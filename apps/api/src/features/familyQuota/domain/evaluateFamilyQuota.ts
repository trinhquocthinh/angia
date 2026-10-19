import type { QuotaLimits, QuotaRequest, QuotaResult, UsageCounts } from './FamilyQuota.js';

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

// Mốc 00:00 giờ Việt Nam dạng `YYYY-MM-DDT00:00:00+07:00` để client hiển thị đúng ngày địa phương.
function vietnamMidnightIso(instant: Date): string {
  const day = new Date(instant.getTime() + VIETNAM_OFFSET_MS).toISOString().slice(0, 10);
  return `${day}T00:00:00+07:00`;
}

// Một chiều chỉ vượt khi có xin thêm: hạ ngưỡng env thấp hơn mức đang dùng không chặn thao tác không thêm gì.
const exceeds = (used: number, added: number, limit: number) => added > 0 && used + added > limit;

// SPEC-030: thứ tự dung lượng → ảnh/ngày → chờ worker; trả mã đầu tiên vi phạm.
export function evaluateFamilyQuota(
  usage: UsageCounts,
  request: QuotaRequest,
  limits: QuotaLimits,
  resetsAt: Date,
): QuotaResult {
  if (exceeds(usage.storageBytes, request.bytes, limits.storageBytes)) {
    const details = {
      usedBytes: usage.storageBytes,
      limitBytes: limits.storageBytes,
      requestedBytes: request.bytes,
    };
    return { ok: false, code: 'ERR_STORAGE_QUOTA', details };
  }
  if (exceeds(usage.uploadsToday, request.files, limits.dailyUploads)) {
    const details = {
      used: usage.uploadsToday,
      limit: limits.dailyUploads,
      requested: request.files,
      resetsAt: vietnamMidnightIso(resetsAt),
    };
    return { ok: false, code: 'ERR_DAILY_UPLOAD_QUOTA', details };
  }
  if (exceeds(usage.pendingJobs, request.jobs, limits.pendingJobs)) {
    const details = { used: usage.pendingJobs, limit: limits.pendingJobs, requested: request.jobs };
    return { ok: false, code: 'ERR_QUEUE_QUOTA', details };
  }
  return { ok: true };
}
