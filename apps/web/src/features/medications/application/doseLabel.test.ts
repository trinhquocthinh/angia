import { describe, expect, it } from 'vitest';
import { doseLabel } from './doseLabel';

describe('Nhãn liều mỗi lần của đợt thuốc (BR-025, BR-033)', () => {
  it('có liều: ghi số theo kiểu Việt Nam kèm đơn vị', () => {
    expect(doseLabel(0.5, 'viên')).toBe('Mỗi lần 0,5 viên');
    expect(doseLabel(2, null)).toBe('Mỗi lần 2');
  });

  it('TC-241: thuốc dùng ngoài không có liều → theo cách ghi trên đơn', () => {
    expect(doseLabel(null, 'tuýp')).toBe('Dùng theo cách ghi trên đơn');
  });
});
