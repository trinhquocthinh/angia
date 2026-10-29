import { describe, expect, it } from 'vitest';
import { isValidBirthYear } from './isValidBirthYear.js';

describe('Năm sinh theo giờ Việt Nam', () => {
  it.each([
    [1899, false],
    [1900, true],
    [2026, true],
    [2027, false],
    [2000.5, false],
    [NaN, false],
  ])('TC-443: năm sinh %s có tính hợp lệ %s', (year, valid) => {
    expect(isValidBirthYear(year, new Date('2026-06-01T00:00:00Z'))).toBe(valid);
  });

  it('TC-443: chấp nhận năm mới từ 0 giờ Việt Nam', () => {
    expect(isValidBirthYear(2026, new Date('2025-12-31T16:59:59Z'))).toBe(false);
    expect(isValidBirthYear(2026, new Date('2025-12-31T17:00:00Z'))).toBe(true);
  });
});
