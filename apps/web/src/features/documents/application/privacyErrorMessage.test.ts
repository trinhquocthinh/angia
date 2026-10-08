import { describe, expect, it } from 'vitest';
import { privacyErrorMessage } from './privacyErrorMessage';
import { ReviewRequestError } from './ReviewRequestError';
describe('Thông báo lỗi bước kiểm tra', () => {
  it('TC-219b: lỗi mạng hoặc parser không hiển thị chi tiết kỹ thuật trong UI', () => {
    for (const error of [
      new TypeError('Failed to fetch'),
      new SyntaxError('Unexpected token'),
      { code: 'internal' },
    ]) {
      expect(privacyErrorMessage(error)).toBe(
        'Không thể tải hoặc lưu chứng từ. Kiểm tra kết nối rồi thử lại.',
      );
    }
  });
  it('TC-219c: giữ hướng dẫn nghiệp vụ tiếng Việt từ API', () => {
    expect(privacyErrorMessage(new ReviewRequestError('Hồ sơ chưa có đồng thuận.', 409))).toBe(
      'Hồ sơ chưa có đồng thuận.',
    );
  });
});
