import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { AdminRequestError } from './AdminRequestError';
import type { AdminAuditRepository, AdminStatsRepository } from './ports';
import { useAdminStats } from './useAdminStats';
import { useAdminAuditEvents } from './useAdminAuditEvents';
function harness(accountId: string | null = 'admin-a') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['current-session'], { id: accountId });
  const stats: AdminStatsRepository = { get: vi.fn(async () => ({ weeks: [] })) };
  const audit: AdminAuditRepository = { list: vi.fn(async () => ({ items: [], nextCursor: null })) };
  let state!: { stats: ReturnType<typeof useAdminStats>; audit: ReturnType<typeof useAdminAuditEvents> };
  function Probe() {
    state = { stats: useAdminStats(stats, accountId), audit: useAdminAuditEvents(audit, accountId) };
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return { client, stats, audit, state };
}
it('TC-841/844: thiếu tài khoản không đọc API kể cả refetch', async () => {
  const h = harness(null);
  try {
    expect(h.state.stats.fetchStatus).toBe('idle');
    expect(h.state.audit.events.fetchStatus).toBe('idle');
    expect((await h.state.stats.refetch()).error).toMatchObject({ status: 401 });
    expect((await h.state.audit.events.refetch()).error).toMatchObject({ status: 401 });
    expect(h.stats.get).not.toHaveBeenCalled();
    expect(h.audit.list).not.toHaveBeenCalled();
  } finally {
    h.client.clear();
  }
});
it('TC-841/844: cache cách ly theo tài khoản và không dùng CSRF làm khoá', async () => {
  const h = harness();
  try {
    await h.state.stats.refetch();
    await h.state.audit.events.refetch();
    expect(h.client.getQueryData(['admin', 'stats', 'admin-a'])).toEqual({ weeks: [] });
    expect(h.client.getQueryData(['admin', 'stats', 'admin-b'])).toBeUndefined();
    const audit = h.client.getQueriesData({ queryKey: ['admin', 'audit-events', 'admin-a'] });
    expect(audit[0]?.[1]).toEqual({ pages: [{ items: [], nextCursor: null }], pageParams: [undefined] });
    expect(h.client.getQueriesData({ queryKey: ['admin', 'audit-events', 'admin-b'] })).toEqual([]);
  } finally {
    h.client.clear();
  }
});
it.each([401, 403, 422])(
  'TC-841/844: lỗi %s chỉ gọi một lần, làm mới phiên khi mất quyền',
  async (status) => {
    const h = harness();
    try {
      await h.state.stats.refetch();
      await h.state.audit.events.refetch();
      vi.mocked(h.stats.get).mockClear();
      vi.mocked(h.audit.list).mockClear();
      const error = new AdminRequestError('ERR_VALIDATION', status);
      vi.mocked(h.stats.get).mockRejectedValue(error);
      vi.mocked(h.audit.list).mockRejectedValue(error);
      expect((await h.state.stats.refetch()).error).toBe(error);
      expect((await h.state.audit.events.refetch()).error).toBe(error);
      expect(h.stats.get).toHaveBeenCalledTimes(1);
      expect(h.audit.list).toHaveBeenCalledTimes(1);
      expect(h.client.getQueryState(['current-session'])?.isInvalidated).toBe(status !== 422);
    } finally {
      h.client.clear();
    }
  },
);
it('TC-841: trang kế tiếp dùng cursor và nối vào cache, không thay trang đầu', async () => {
  const h = harness();
  try {
    vi.mocked(h.audit.list).mockResolvedValueOnce({ items: [], nextCursor: 'next+micro/==' });
    await h.state.audit.events.refetch();
    vi.mocked(h.audit.list).mockResolvedValue({ items: [], nextCursor: null });
    const result = await h.state.audit.events.fetchNextPage();
    expect(result.data?.pages).toEqual([
      { items: [], nextCursor: 'next+micro/==' },
      { items: [], nextCursor: null },
    ]);
    expect(h.audit.list).toHaveBeenLastCalledWith(
      { limit: 50, cursor: 'next+micro/==' },
      expect.any(AbortSignal),
    );
    expect(result.hasNextPage).toBe(false);
  } finally {
    h.client.clear();
  }
});
