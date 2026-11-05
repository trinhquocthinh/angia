import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentProps } from 'react';
import { describe, expect, it } from 'vitest';
import { AiBudgetCard } from './AiBudgetCard';
describe('Trần tiền dùng phí provider', () => {
  it('TC-618: không dùng tiền reservation cũ làm phí thực, thiếu billing không giả bằng 0', () => {
    const props = {
      budget: { isError: false, data: { month: '2026-10', monthlyCapUsd: 5, spentThisMonthUsd: 4.99 } },
      save: {},
      billing: {
        data: { month: '2026-10', status: 'ready', actualSpendUsd: '0.250000000000' },
        isError: false,
        isFetching: false,
      },
    } as unknown as ComponentProps<typeof AiBudgetCard>;
    const html = renderToStaticMarkup(<AiBudgetCard {...props} />);
    expect(html).toContain('0,25');
    expect(html).not.toContain('4,99');
    const missing = renderToStaticMarkup(
      <AiBudgetCard {...props} billing={{ ...props.billing, isError: true }} />,
    );
    expect(missing).toContain('Chưa xác định phí thực');
    expect(missing).not.toContain('0,25');
  });
  it.each([
    ['đang đọc lại', true, '2026-10', 'ready'],
    ['khác tháng', false, '2026-11', 'ready'],
    ['coverage stale', false, '2026-10', 'stale'],
  ] as const)('TC-619: %s không trình bày phí như đã xác nhận', (_label, isFetching, month, status) => {
    const props = {
      budget: { isError: false, data: { month: '2026-10', monthlyCapUsd: 5, spentThisMonthUsd: 4.99 } },
      save: {},
      billing: { data: { month, status, actualSpendUsd: '0.250000000000' }, isError: false, isFetching },
    } as unknown as ComponentProps<typeof AiBudgetCard>;
    const html = renderToStaticMarkup(<AiBudgetCard {...props} />);
    expect(html).toContain('Chưa xác định phí thực');
    expect(html).not.toContain('0,25');
    expect(html).not.toContain('4,99');
  });
});
