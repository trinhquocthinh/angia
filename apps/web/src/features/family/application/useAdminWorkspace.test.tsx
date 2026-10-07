import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useAdminWorkspace } from './useAdminWorkspace';
import type { AdminRepository } from './ports';

const family = { id: 'f', name: 'Nhà An', createdAt: '2026-10-05T00:00:00Z' };
const account = { id: 'a', displayName: 'An', isSystemAdmin: false, familyId: null, role: null };
function repository(fail = false): AdminRepository {
  return {
    listFamilies: async () => [family],
    listAccounts: async () => [account],
    createFamily: async () => {
      if (fail) throw new Error('Lỗi mạng');
      return family;
    },
    assign: async () => account,
    change: async () => account,
  };
}
describe('Cache quản trị sau thao tác', () => {
  it.each([false, true])('chỉ đánh dấu cache cần tải lại khi thành công; lỗi=%s', async (fail) => {
    const client = new QueryClient();
    client.setQueryData(['admin', 'families'], []);
    client.setQueryData(['admin', 'accounts'], []);
    client.setQueryData(['current-session'], { csrfToken: 'csrf' });
    let workspace: ReturnType<typeof useAdminWorkspace> | undefined;
    function Probe() {
      workspace = useAdminWorkspace(repository(fail), 'csrf');
      return null;
    }
    renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
    const result = workspace!.action.mutateAsync({ type: 'create', name: 'Nhà An' });
    if (fail) await expect(result).rejects.toThrow('Lỗi mạng');
    else await result;
    expect(client.getQueryState(['admin', 'families'])?.isInvalidated).toBe(!fail);
    expect(client.getQueryState(['admin', 'accounts'])?.isInvalidated).toBe(!fail);
    expect(client.getQueryState(['current-session'])?.isInvalidated).toBe(!fail);
    client.clear();
  });
  it('không tải danh sách khi chưa có CSRF của phiên admin', () => {
    const client = new QueryClient();
    function Probe() {
      useAdminWorkspace(repository(), null);
      return null;
    }
    renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
    expect(
      client
        .getQueryCache()
        .getAll()
        .every((query) => query.state.fetchStatus === 'idle'),
    ).toBe(true);
    client.clear();
  });
});
