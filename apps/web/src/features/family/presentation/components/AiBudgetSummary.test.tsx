import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AiBudgetSummary } from './AiBudgetSummary';

describe('Thẻ Chi phí AI tháng này (SPEC-013, Stitch f9e3fb04)', () => {
  it('hiện đã dùng / trần, phần trăm định mức, còn lại và thanh tiến độ cho trình đọc màn hình', () => {
    const html = renderToStaticMarkup(
      <AiBudgetSummary budget={{ month: '2026-10', monthlyCapUsd: 5, spentThisMonthUsd: 0.42 }} />,
    );
    expect(html).toContain('0,42');
    expect(html).toContain('/ 5,00 USD');
    expect(html).toContain('Đã dùng 8,4% định mức');
    expect(html).toContain('Còn lại 4,58 USD');
    expect(html).toContain('aria-valuenow="8.4"');
    expect(html).toContain('bg-[#55615f]');
    expect(html).not.toContain('Đã chạm trần');
  });

  it('TC-041: đã dùng $3.00 ≥ trần $2.00 → thanh đỏ 100%, báo chứng từ mới sẽ chờ ngân sách', () => {
    const html = renderToStaticMarkup(
      <AiBudgetSummary budget={{ month: '2026-10', monthlyCapUsd: 2, spentThisMonthUsd: 3 }} />,
    );
    expect(html).toContain('Đã chạm trần');
    expect(html).toContain('aria-valuenow="100"');
    expect(html).toContain('bg-[#ba1a1a]');
  });
});
