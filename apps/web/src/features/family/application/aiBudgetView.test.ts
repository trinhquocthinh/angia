import { describe, expect, it } from 'vitest';
import { describeAiBudget, parseBudgetCap } from './aiBudgetView';

describe('Nhập trần ngân sách AI (SPEC-013)', () => {
  it('nhận số USD 0 – 100, tối đa 2 chữ số thập phân, chấp nhận dấu phẩy thập phân', () => {
    expect(['2', '4.5', '4,50', ' 0 ', '100', '0.07'].map(parseBudgetCap)).toEqual([
      2, 4.5, 4.5, 0, 100, 0.07,
    ]);
  });

  it('từ chối rỗng, âm, vượt 100, lẻ hơn 0.01 hoặc không phải số', () => {
    expect(['', '-1', '100.01', '1.005', 'abc', '1e2', '1.2.3'].map(parseBudgetCap)).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
  });
});

describe('Hiển thị mức dùng ngân sách AI', () => {
  it('định dạng tháng, số tiền và phần trăm đã dùng', () => {
    expect(describeAiBudget({ month: '2026-10', monthlyCapUsd: 5, spentThisMonthUsd: 1.25 })).toEqual({
      monthLabel: 'Tháng 10/2026',
      spent: '$1.25',
      cap: '$5.00',
      percent: 25,
      exhausted: false,
    });
  });

  it('đã dùng ≥ trần (kể cả trần $0) → báo đã chạm trần, thanh tiến độ dừng ở 100%', () => {
    expect(describeAiBudget({ month: '2026-10', monthlyCapUsd: 2, spentThisMonthUsd: 3 })).toMatchObject({
      percent: 100,
      exhausted: true,
    });
    expect(describeAiBudget({ month: '2026-10', monthlyCapUsd: 0, spentThisMonthUsd: 0 })).toMatchObject({
      percent: 100,
      exhausted: true,
    });
  });

  it('chi phí lẻ dưới 1 cent vẫn hiện 4 chữ số để thấy được lời gọi $0.001', () => {
    expect(describeAiBudget({ month: '2026-10', monthlyCapUsd: 5, spentThisMonthUsd: 0.00113 }).spent).toBe(
      '$0.0011',
    );
  });
});
