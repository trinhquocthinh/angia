import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AiBudgetSummary } from './AiBudgetSummary';

describe('Thẻ ngân sách AI (SPEC-013)', () => {
  it('hiện tháng, đã dùng / trần và thanh tiến độ có giá trị cho trình đọc màn hình', () => {
    const html = renderToStaticMarkup(
      <AiBudgetSummary budget={{ month: '2026-10', monthlyCapUsd: 5, spentThisMonthUsd: 1.25 }} />,
    );
    expect(html).toContain('Tháng 10/2026');
    expect(html).toContain('$1.25');
    expect(html).toContain('$5.00');
    expect(html).toContain('aria-valuenow="25"');
    expect(html).not.toContain('Đã chạm trần');
  });

  it('TC-041: đã dùng $3.00 ≥ trần $2.00 → báo chứng từ mới sẽ chờ ngân sách', () => {
    const html = renderToStaticMarkup(
      <AiBudgetSummary budget={{ month: '2026-10', monthlyCapUsd: 2, spentThisMonthUsd: 3 }} />,
    );
    expect(html).toContain('Đã chạm trần');
    expect(html).toContain('aria-valuenow="100"');
  });
});
