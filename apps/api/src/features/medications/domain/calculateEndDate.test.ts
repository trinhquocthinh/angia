import { describe, expect, it } from 'vitest';
import { calculateEndDate } from './calculateEndDate.js';

describe('calculateEndDate — BR-026', () => {
  it('TC-053 — liệu trình 30 ngày từ 01/10 kết thúc ngày 30/10', () => {
    expect(calculateEndDate('2026-10-01', 30)).toBe('2026-10-30');
  });

  it('TC-084 — liệu trình 1 ngày kết thúc đúng ngày bắt đầu', () => {
    expect(calculateEndDate('2026-10-01', 1)).toBe('2026-10-01');
  });

  it('TC-054 — thời hạn đã xác định là dài hạn có ngày kết thúc null', () => {
    expect(calculateEndDate('2026-10-01', null)).toBeNull();
  });

  it.each([
    ['2026-01-31', 2, '2026-02-01'],
    ['2026-12-31', 2, '2027-01-01'],
    ['2024-02-28', 3, '2024-03-01'],
    ['2026-02-28', 2, '2026-03-01'],
  ])('TC-232 — cộng ngày lịch qua biên tháng/năm: %s + %i ngày → %s', (start, days, expected) => {
    expect(calculateEndDate(start, days)).toBe(expected);
  });
});
