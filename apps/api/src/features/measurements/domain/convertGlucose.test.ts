import { describe, expect, it } from 'vitest';
import { convertGlucose } from './convertGlucose.js';

describe('convertGlucose — BR-020, SDD §2.2 (mg/dL = mmol/L × 18)', () => {
  it('TC-059 — 126 mg/dL hiển thị 7.0 mmol/L', () => {
    expect(convertGlucose(126, 'mg/dL', 'mmol/L')).toBe(7);
  });

  it.each([
    [100, 'mg/dL', 'mmol/L', 5.6],
    [7.2, 'mmol/L', 'mg/dL', 130],
    [5.55, 'mmol/L', 'mg/dL', 100],
  ] as const)('TC-251 — %s %s → %s %s (mmol/L 1 số lẻ, mg/dL số nguyên)', (value, from, to, expected) => {
    expect(convertGlucose(value, from, to)).toBe(expected);
  });

  it('TC-251 — cùng đơn vị giữ nguyên giá trị gốc, không làm tròn', () => {
    expect(convertGlucose(7.25, 'mmol/L', 'mmol/L')).toBe(7.25);
    expect(convertGlucose(126.5, 'mg/dL', 'mg/dL')).toBe(126.5);
  });
});
