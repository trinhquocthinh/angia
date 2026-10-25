import { describe, expect, it } from 'vitest';
import { computeSessionExpiry } from './computeSessionExpiry.js';

describe('computeSessionExpiry', () => {
  it('phiên hết hạn sau đúng 30 ngày kể từ thời điểm tính', () => {
    const now = new Date('2026-10-05T03:00:00.000Z');
    expect(computeSessionExpiry(now).toISOString()).toBe('2026-11-04T03:00:00.000Z');
  });

  it('không sửa đối tượng Date đầu vào', () => {
    const now = new Date('2026-10-05T03:00:00.000Z');
    computeSessionExpiry(now);
    expect(now.toISOString()).toBe('2026-10-05T03:00:00.000Z');
  });
});
