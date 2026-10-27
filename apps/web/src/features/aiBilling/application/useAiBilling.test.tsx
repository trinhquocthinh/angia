import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AdminRequestError } from '@src/features/family/application/AdminRequestError';
import { useAiBilling } from './useAiBilling';
import type { AiBillingRepository } from './ports';

function harness(account: string | null = 'admin-a') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['current-session'], { id: account });
  const repository: AiBillingRepository = {
    get: vi.fn<AiBillingRepository['get']>().mockResolvedValue({
      month: '2026-10',
      unit: 'USD',
      status: 'unconfigured',
      confirmedSpendUsd: '0.000000000000',
      actualSpendUsd: null,
      lastSyncedAt: null,
      sources: [],
    }),
  };
  let state: ReturnType<typeof useAiBilling> | undefined;
  function Probe() {
    state = useAiBilling(repository, account);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return { client, repository, state: state! };
}
describe('Query phí theo phiên Admin', () => {
  it('TC-547: thiếu account không tự GET, kể cả refetch không chạm repository', async () => {
    const h = harness(null);
    expect(h.repository.get).not.toHaveBeenCalled();
    expect((await h.state.refetch()).error).toMatchObject({ status: 401 });
    expect(h.repository.get).not.toHaveBeenCalled();
    h.client.clear();
  });
  it('TC-547: kết quả chỉ vào cache account đang đọc, không dùng token làm query key', async () => {
    const h = harness();
    await h.state.refetch();
    expect(h.client.getQueryData(['admin', 'ai-billing', 'admin-a'])).toMatchObject({
      status: 'unconfigured',
    });
    expect(h.client.getQueryData(['admin', 'ai-billing', 'admin-b'])).toBeUndefined();
    h.client.clear();
  });
  it.each([401, 403])('TC-547: GET%s làm mới session và không tự retry lặp', async (status) => {
    const h = harness();
    await h.state.refetch();
    vi.mocked(h.repository.get).mockClear();
    vi.mocked(h.repository.get).mockRejectedValue(new AdminRequestError('ERR_FORBIDDEN', status));
    expect((await h.state.refetch()).isError).toBe(true);
    expect(h.repository.get).toHaveBeenCalledTimes(1);
    expect(h.client.getQueryState(['current-session'])?.isInvalidated).toBe(true);
    h.client.clear();
  });
});
