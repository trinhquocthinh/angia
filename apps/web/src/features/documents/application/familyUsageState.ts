import type { FamilyUsage } from '@angia/contracts';

const MIB = 1024 ** 2;
const GIB = 1024 ** 3;
const oneDecimal = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const formatGibibytes = (bytes: number) => `${oneDecimal.format(bytes / GIB)} GiB`;
// Dưới 1 GiB hiện theo MB để mức dùng nhỏ (vài ảnh) không bị làm tròn thành "0,0".
export const formatStorageUsage = (used: number, limit: number) =>
  used < GIB
    ? `${oneDecimal.format(used / MIB)} MB / ${formatGibibytes(limit)}`
    : `${oneDecimal.format(used / GIB)} / ${formatGibibytes(limit)}`;

// SPEC-031: đã chi > 0 nhưng phần trăm làm tròn xuống 0 → "dưới 1%".
export const formatAiUsage = (aiOcr: FamilyUsage['aiOcr']) =>
  aiOcr.anyUsed && aiOcr.usedPercent === 0 ? 'dưới 1%' : `${aiOcr.usedPercent}%`;

// SPEC-030: lý do khóa chọn ảnh, cùng thứ tự kiểm của máy chủ (dung lượng → ảnh/ngày). Hàng chờ
// tự động nhận diện không khóa chọn ảnh vì ảnh tự nhập không tính (BR-043); xem aiQueueBlockReason.
export function usageBlockReason(usage: FamilyUsage): string | null {
  const { storage, dailyUploads } = usage;
  if (storage.usedBytes >= storage.limitBytes)
    return 'Gia đình đã dùng hết dung lượng lưu ảnh. Liên hệ quản trị viên để nâng dung lượng; bạn vẫn có thể nhập tay không kèm ảnh.';
  if (dailyUploads.used >= dailyUploads.limit)
    return `Hôm nay gia đình đã tải đủ ${dailyUploads.limit} ảnh. Bạn có thể tải tiếp từ 0 giờ ngày mai.`;
  return null;
}

// BR-043: chờ worker + ảnh gửi AI đã che chưa gửi chạm trần → khóa lựa chọn gửi AI, vẫn tự nhập được.
export function aiQueueBlockReason(usage: FamilyUsage, aiReady: number): string | null {
  const { used, limit } = usage.pendingJobs;
  return used + aiReady >= limit
    ? `Hàng chờ tự động nhận diện của gia đình đã đủ ${limit} ảnh. Bạn vẫn có thể chọn “Tôi tự nhập”, hoặc đợi xử lý xong rồi gửi tiếp.`
    : null;
}

// Số ảnh còn gửi được hôm nay (máy chủ vẫn quyết định).
export const remainingUploadSlots = (usage: FamilyUsage) =>
  Math.max(0, usage.dailyUploads.limit - usage.dailyUploads.used);
