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

// SPEC-030: lý do khóa chọn ảnh, cùng thứ tự kiểm của máy chủ (dung lượng → ảnh/ngày → chờ xử lý).
export function usageBlockReason(usage: FamilyUsage): string | null {
  const { storage, dailyUploads, pendingJobs } = usage;
  if (storage.usedBytes >= storage.limitBytes)
    return 'Gia đình đã dùng hết dung lượng lưu ảnh. Liên hệ quản trị viên để nâng dung lượng; bạn vẫn có thể nhập tay không kèm ảnh.';
  if (dailyUploads.used >= dailyUploads.limit)
    return `Hôm nay gia đình đã tải đủ ${dailyUploads.limit} ảnh. Bạn có thể tải tiếp từ 0 giờ ngày mai.`;
  if (pendingJobs.used >= pendingJobs.limit)
    return `Đang có ${pendingJobs.used} ảnh chờ xử lý. Vui lòng đợi xử lý xong rồi gửi tiếp.`;
  return null;
}

// Số ảnh còn gửi được ngay (máy chủ vẫn quyết định): lượt trong ngày và chỗ trong hàng đợi.
export const remainingUploadSlots = (usage: FamilyUsage) =>
  Math.max(
    0,
    Math.min(
      usage.dailyUploads.limit - usage.dailyUploads.used,
      usage.pendingJobs.limit - usage.pendingJobs.used,
    ),
  );
