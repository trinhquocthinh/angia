import { describe, expect, it } from 'vitest';
import { describeSeries } from './describeSeries';

describe('TC-255 câu mô tả biểu đồ cho trình đọc màn hình (BR-033)', () => {
  it('chỉ nêu khoảng thời gian, số lần đo, số tuần chưa đo', () => {
    const text = describeSeries('blood_pressure', {
      from: '2026-07-27',
      to: '2026-10-12',
      points: 9,
      emptyWeeks: 3,
    });
    expect(text).toBe('Huyết áp từ 27/07/2026 đến 12/10/2026: 9 lần đo, 3 tuần chưa đo.');
  });

  it('không có tuần trống thì bỏ vế tuần chưa đo; không có từ nhận xét biến thiên', () => {
    const text = describeSeries('glucose', {
      from: '2026-09-14',
      to: '2026-10-11',
      points: 4,
      emptyWeeks: 0,
    });
    expect(text).toBe('Đường huyết từ 14/09/2026 đến 11/10/2026: 4 lần đo.');
    expect(text).not.toMatch(/tăng|giảm|cao|thấp|tốt|xấu|bất thường|ổn định/i);
  });
});
