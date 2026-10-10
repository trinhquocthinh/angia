import { describe, expect, it } from 'vitest';
import { budgetMonth } from './budgetMonth.js';

describe('Tháng ngân sách AI theo Asia/Ho_Chi_Minh (BR-018, E3-S6-T1)', () => {
  it('23:59:59 ngày 31/10 giờ Việt Nam vẫn thuộc tháng 10', () => {
    expect(budgetMonth(new Date('2026-10-31T16:59:59Z'))).toBe('2026-10');
  });

  it('00:00 ngày 01/11 giờ Việt Nam (17:00 UTC hôm trước) đã sang tháng 11', () => {
    expect(budgetMonth(new Date('2026-10-31T17:00:00Z'))).toBe('2026-11');
  });

  it('qua năm mới: 00:30 ngày 01/01/2027 giờ Việt Nam → 2027-01', () => {
    expect(budgetMonth(new Date('2026-12-31T17:30:00Z'))).toBe('2027-01');
  });
});
