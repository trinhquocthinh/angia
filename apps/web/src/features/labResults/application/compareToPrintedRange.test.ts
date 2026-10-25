import { describe, expect, it } from 'vitest';
import { compareToPrintedRange } from './compareToPrintedRange';

describe('compareToPrintedRange — BR-033 làm rõ 2026-10-25', () => {
  it.each([
    ['7,2', '3,9 - 6,4', null, 'above'],
    ['3.5', '3.9–6.4', null, 'below'],
    ['6.4', '3.9-6.4', null, null],
    ['3.9', '3.9 ~ 6.4', null, null],
    ['250', '< 200', null, 'above'],
    ['200', '< 200', null, 'above'],
    ['200', '≤ 200', null, null],
    ['201', '<= 200', null, 'above'],
    ['40', '≥ 40', null, null],
    ['39', '>= 40', null, 'below'],
    ['40', '> 40', null, 'below'],
    ['7.2 %', '4.0 - 6.0', '%', 'above'],
  ] as const)('TC-397 — giá trị "%s" với khoảng "%s" → %s', (value, range, unit, expected) => {
    expect(compareToPrintedRange(value, range, unit)).toBe(expected);
  });

  it.each([
    ['Âm tính', '0 - 1', null],
    ['<5', '0 - 10', null],
    ['1+', '0 - 1', null],
    ['7.2', null, null],
    ['80', 'Nam: 62-120; Nữ: 53-100', null],
    ['abc', '1 - 2', null],
  ] as const)('TC-398 — "%s" với "%s" không đọc chắc chắn được → không đánh dấu', (value, range, unit) => {
    expect(compareToPrintedRange(value, range, unit)).toBeNull();
  });

  it.each([
    ['250000', '150.000 - 400.000', null, null],
    ['10,000', '4 - 10', null, null],
    ['7.2', '(3.9 - 6.4)', null, 'above'],
    ['7.2', '3.9 - 6.4 mmol/L', 'mmol/L', 'above'],
    ['5', '6.4 - 3.9', null, null],
    ['-1', '0 - 5', null, null],
  ] as const)('TC-398 — ca biên: "%s" với "%s" → %s', (value, range, unit, expected) => {
    expect(compareToPrintedRange(value, range, unit)).toBe(expected);
  });
});
