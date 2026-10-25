import { describe, expect, it } from 'vitest';
import { weekStartOf } from './weekStartOf.js';

describe('weekStartOf — BR-023 tuần Thứ Hai → Chủ Nhật', () => {
  it('TC-085 — số đo 23:59 Chủ Nhật 2026-10-11 (giờ Việt Nam) thuộc tuần bắt đầu Thứ Hai 2026-10-05', () => {
    expect(weekStartOf('2026-10-11')).toBe('2026-10-05');
  });

  it.each([
    ['2026-10-05', '2026-10-05'],
    ['2026-10-12', '2026-10-12'],
    ['2026-01-01', '2025-12-29'],
    ['2024-03-03', '2024-02-26'],
  ])('TC-250 — ngày %s thuộc tuần bắt đầu %s (qua biên tháng/năm)', (date, monday) => {
    expect(weekStartOf(date)).toBe(monday);
  });
});
