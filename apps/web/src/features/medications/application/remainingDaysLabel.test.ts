import { describe, expect, it } from 'vitest';
import { remainingDaysLabel } from './remainingDaysLabel';
describe('Nhãn thời hạn đợt thuốc (Design §6, E4-S4-T1)', () => {
  it('TC-239: tính cả hôm nay — đợt 01/10–30/10 tại 13/10 còn 18 ngày, ngày cuối còn 1 ngày', () => {
    expect(remainingDaysLabel('2026-10-30', '2026-10-13')).toBe('Còn 18 ngày');
    expect(remainingDaysLabel('2026-10-30', '2026-10-30')).toBe('Còn 1 ngày');
  });
  it('TC-239: qua biên tháng/năm nhuận tính theo ngày lịch', () => {
    expect(remainingDaysLabel('2028-03-01', '2028-02-28')).toBe('Còn 3 ngày');
    expect(remainingDaysLabel('2027-01-02', '2026-12-31')).toBe('Còn 3 ngày');
  });
  it('TC-239: đợt không có ngày kết thúc là Dài hạn', () => {
    expect(remainingDaysLabel(null, '2026-10-13')).toBe('Dài hạn');
  });
});
