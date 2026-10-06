import { describe, expect, it, vi } from 'vitest';
import { currentVietnamYear } from './currentVietnamYear';
import { readProfileDraft } from './readProfileDraft';
describe('Năm hiện tại theo Asia/Ho_Chi_Minh khi gửi form', () => {
  it('đổi giới hạn năm tại giao thừa Việt Nam khi UTC vẫn là năm cũ', () => {
    expect(currentVietnamYear(new Date('2026-12-31T16:59:59Z'))).toBe(2026);
    expect(currentVietnamYear(new Date('2026-12-31T17:00:00Z'))).toBe(2027);
    expect(
      readProfileDraft('Bé An', '2027', '', currentVietnamYear(new Date('2026-12-31T16:59:59Z'))).errors
        .birthYear,
    ).toBeTruthy();
    expect(
      readProfileDraft('Bé An', '2027', '', currentVietnamYear(new Date('2026-12-31T17:00:00Z'))).errors
        .birthYear,
    ).toBeUndefined();
  });
  it('đọc lại thời gian mỗi lần gọi thay vì giữ năm khi khởi động', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-12-31T16:59:59Z'));
      expect(currentVietnamYear()).toBe(2026);
      vi.setSystemTime(new Date('2026-12-31T17:00:00Z'));
      expect(currentVietnamYear()).toBe(2027);
    } finally {
      vi.useRealTimers();
    }
  });
});
