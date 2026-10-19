import { describe, expect, it } from 'vitest';
import { DocumentUploadError } from './DocumentUploadError';
import { uploadErrorMessage } from './uploadErrorMessage';

describe('TC-302 — thông điệp lỗi quota khi tải lô (SPEC-030)', () => {
  it.each([
    [
      413,
      'ERR_STORAGE_QUOTA',
      'Gia đình đã dùng hết dung lượng lưu ảnh. Liên hệ quản trị viên để nâng dung lượng; bạn vẫn có thể nhập tay không kèm ảnh.',
    ],
    [
      429,
      'ERR_DAILY_UPLOAD_QUOTA',
      'Hôm nay gia đình đã tải đủ số ảnh cho phép. Bạn có thể tải tiếp từ 0 giờ ngày mai.',
    ],
    [429, 'ERR_QUEUE_QUOTA', 'Đang có nhiều ảnh chờ xử lý. Vui lòng đợi xử lý xong rồi gửi tiếp.'],
    [429, 'ERR_RATE_LIMITED', 'Bạn thao tác hơi nhanh. Vui lòng thử lại sau ít giây.'],
  ])('HTTP %i %s', (status, code, message) => {
    expect(uploadErrorMessage(new DocumentUploadError(status, code))).toBe(message);
  });
});
