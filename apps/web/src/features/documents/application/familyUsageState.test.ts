import type { FamilyUsage } from '@angia/contracts';
import { describe, expect, it } from 'vitest';
import { formatStorageUsage, remainingUploadSlots, usageBlockReason } from './familyUsageState';

const usage = (
  overrides: Partial<{ storage: number; daily: number; pending: number }> = {},
): FamilyUsage => ({
  storage: { usedBytes: overrides.storage ?? 0, limitBytes: 2 * 1024 ** 3 },
  dailyUploads: { used: overrides.daily ?? 0, limit: 100, resetsAt: '2026-10-20T00:00:00+07:00' },
  pendingJobs: { used: overrides.pending ?? 0, limit: 10 },
  aiOcr: { month: '2026-10', usedPercent: 0, exhausted: false },
});

describe('TC-302 — trạng thái mức sử dụng của gia đình trên trang tải ảnh (SPEC-030)', () => {
  it('chưa chạm trần nào thì không khóa', () => {
    expect(usageBlockReason(usage({ storage: 1, daily: 99, pending: 9 }))).toBeNull();
  });

  it('nêu lý do khóa theo thứ tự dung lượng → ảnh/ngày → chờ xử lý', () => {
    expect(usageBlockReason(usage({ storage: 2 * 1024 ** 3, daily: 100, pending: 10 }))).toBe(
      'Gia đình đã dùng hết dung lượng lưu ảnh. Liên hệ quản trị viên để nâng dung lượng; bạn vẫn có thể nhập tay không kèm ảnh.',
    );
    expect(usageBlockReason(usage({ daily: 100, pending: 10 }))).toBe(
      'Hôm nay gia đình đã tải đủ 100 ảnh. Bạn có thể tải tiếp từ 0 giờ ngày mai.',
    );
    expect(usageBlockReason(usage({ pending: 10 }))).toBe(
      'Đang có 10 ảnh chờ xử lý. Vui lòng đợi xử lý xong rồi gửi tiếp.',
    );
  });

  it('số ảnh còn gửi được = min(lượt còn trong ngày, chỗ còn trong hàng đợi), không âm', () => {
    expect(remainingUploadSlots(usage({ daily: 95, pending: 7 }))).toBe(3);
    expect(remainingUploadSlots(usage({ daily: 100, pending: 12 }))).toBe(0);
  });

  it('định dạng dung lượng GiB kiểu Việt Nam, một chữ số thập phân', () => {
    expect(formatStorageUsage(1288490188, 2 * 1024 ** 3)).toBe('1,2 / 2,0 GiB');
    expect(formatStorageUsage(0, 5 * 1024 ** 3)).toBe('0,0 / 5,0 GiB');
  });
});
