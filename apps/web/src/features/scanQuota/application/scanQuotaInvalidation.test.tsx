import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { useAiBudget } from '@src/features/family/application/useAiBudget';
import type { AiBudgetRepository } from '@src/features/family/application/ports';
import { view } from '../test/scanQuotaFixtures';
describe('Làm mới khả năng cấp lượt', () => {
  it('TC-590: lưu trần ngân sách hiện tại làm mới tổng quan hạn mức', async () => {
    const client = new QueryClient();
    client.setQueryData(['admin', 'scan-quotas', 'a'], view);
    const budget = { month: '2026-10', monthlyCapUsd: 5, spentThisMonthUsd: 0 };
    const repository: AiBudgetRepository = {
      get: vi.fn(async () => budget),
      setCap: vi.fn(async () => ({ ...budget, monthlyCapUsd: 6 })),
    };
    let state!: ReturnType<typeof useAiBudget>;
    function Probe() {
      state = useAiBudget(repository, 'csrf');
      return null;
    }
    renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
    await state.save.mutateAsync(6);
    expect(client.getQueryState(['admin', 'scan-quotas', 'a'])?.isInvalidated).toBe(true);
    client.clear();
  });
});
