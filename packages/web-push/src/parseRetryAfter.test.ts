import { describe, expect, it } from 'vitest';
import { parseRetryAfter } from './parseRetryAfter.js';

const now = new Date('2026-10-23T01:00:00Z');

describe('Đọc tiêu đề Retry-After', () => {
  it('TC-350: số giây trả về nguyên giá trị', () => {
    expect(parseRetryAfter('120', now)).toBe(120);
  });
  it('TC-350: ngày HTTP trả về số giây còn lại; ngày quá khứ thành 0', () => {
    expect(parseRetryAfter('Thu, 23 Oct 2026 01:02:00 GMT', now)).toBe(120);
    expect(parseRetryAfter('Thu, 23 Oct 2026 00:00:00 GMT', now)).toBe(0);
  });
  it('TC-350: thiếu hoặc sai định dạng trả về undefined', () => {
    expect(parseRetryAfter(undefined, now)).toBeUndefined();
    expect(parseRetryAfter('abc', now)).toBeUndefined();
  });
});
