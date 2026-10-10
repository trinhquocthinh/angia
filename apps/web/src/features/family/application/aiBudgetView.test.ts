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

describe('Hiển thị mức dùng ngân sách AI (Stitch f9e3fb04)', () => {
  it('định dạng số kiểu Việt Nam, phần trăm 1 chữ số, còn lại và ngày đặt lại đầu tháng sau', () => {
    expect(describeAiBudget({ month: '2026-10', monthlyCapUsd: 5, spentThisMonthUsd: 0.42 })).toEqual({
      monthLabel: 'Tháng 10/2026',
      spent: '0,42',
      cap: '5,00',
      remaining: '4,58',
      percent: 8.4,
      percentLabel: '8,4%',
      level: 'normal',
      resetDate: '01/11/2026',
    });
  });

  it('tháng 12 đặt lại vào 01/01 năm sau', () => {
    expect(describeAiBudget({ month: '2026-12', monthlyCapUsd: 5, spentThisMonthUsd: 0 }).resetDate).toBe(
      '01/01/2027',
    );
  });

  it('từ 90% định mức → cảnh báo; đã dùng ≥ trần (kể cả trần 0) → chạm trần, còn lại 0, thanh dừng ở 100%', () => {
    expect(describeAiBudget({ month: '2026-10', monthlyCapUsd: 5, spentThisMonthUsd: 4.5 }).level).toBe(
      'warning',
    );
    expect(describeAiBudget({ month: '2026-10', monthlyCapUsd: 2, spentThisMonthUsd: 3 })).toMatchObject({
      remaining: '0,00',
      percent: 100,
      level: 'exhausted',
    });
    expect(describeAiBudget({ month: '2026-10', monthlyCapUsd: 0, spentThisMonthUsd: 0 })).toMatchObject({
      percent: 100,
      level: 'exhausted',
    });
  });

  it('chi phí lẻ dưới 1 cent vẫn hiện 4 chữ số để thấy được lời gọi $0.001', () => {
    expect(describeAiBudget({ month: '2026-10', monthlyCapUsd: 5, spentThisMonthUsd: 0.00113 }).spent).toBe(
      '0,0011',
    );
  });
});
