import { describe, expect, it } from 'vitest';
import { isValidRevisitDate } from './isValidRevisitDate.js';

describe('Ngày tái khám theo ngày kê (SPEC-043)', () => {
  it.each([
    ['2026-10-01', null, true],
    ['2026-10-01', '2026-10-01', true],
    ['2026-10-01', '2036-09-28', true],
    ['2026-10-01', '2026-09-30', false],
    ['2026-10-01', '2036-09-29', false],
    ['2024-02-28', '2024-02-29', true],
    ['2026-02-28', '2026-02-29', false],
    ['2026-10-01', '2026-10-31T00:00:00Z', false],
    ['2026-10-01', '', false],
  ])('TC-472: ngày kê %s, hẹn %s → %s', (issuedDate, revisitDate, expected) => {
    expect(isValidRevisitDate(issuedDate, revisitDate)).toBe(expected);
  });
});
