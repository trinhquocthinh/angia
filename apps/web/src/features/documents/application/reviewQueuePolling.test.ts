import { describe, expect, it } from 'vitest';
import { reviewQueuePollInterval } from './reviewQueuePolling';

describe('Làm mới hàng đợi sau khi vừa tải ảnh', () => {
  it('hỏi lại mỗi 5 giây trong 2 phút đầu để chứng từ AI đọc xong tự hiện, sau đó dừng', () => {
    const startedAt = 1_000_000;
    expect(reviewQueuePollInterval(startedAt, startedAt + 10_000)).toBe(5000);
    expect(reviewQueuePollInterval(startedAt, startedAt + 120_001)).toBe(false);
    expect(reviewQueuePollInterval(null, startedAt)).toBe(false);
  });
});
