import { describe, expect, it } from 'vitest';
import { vietnamDayBounds } from './vietnamDayBounds.js';

const iso = (bounds: { start: Date; end: Date }) => ({
  start: bounds.start.toISOString(),
  end: bounds.end.toISOString(),
});

describe('TC-293 — ngày theo giờ Việt Nam cho lượt tải ảnh (SPEC-030)', () => {
  it('23:59:59 giờ VN vẫn thuộc ngày cũ, ngày mới bắt đầu 17:00 UTC', () => {
    expect(iso(vietnamDayBounds(new Date('2026-10-19T16:59:59Z')))).toEqual({
      start: '2026-10-18T17:00:00.000Z',
      end: '2026-10-19T17:00:00.000Z',
    });
  });

  it('đúng 00:00 giờ VN đã sang ngày mới', () => {
    expect(iso(vietnamDayBounds(new Date('2026-10-19T17:00:00Z')))).toEqual({
      start: '2026-10-19T17:00:00.000Z',
      end: '2026-10-20T17:00:00.000Z',
    });
  });

  it('qua năm mới giờ VN', () => {
    expect(vietnamDayBounds(new Date('2026-12-31T17:30:00Z')).end.toISOString()).toBe(
      '2027-01-01T17:00:00.000Z',
    );
  });
});
