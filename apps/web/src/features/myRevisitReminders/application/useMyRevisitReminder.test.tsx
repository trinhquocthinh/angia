import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { useMyRevisitReminder } from './useMyRevisitReminder';
const session = { account: { id: 'a' }, family: { id: 'f' }, role: 'member' } as ProfileSession;
describe('TC-479 — đọc lại lời nhắc trong phạm vi phiên', () => {
  it('member có gia đình được đọc; lỗi tải không hiện lại tên từ cache cũ', () => {
    const client = new QueryClient();
    const key = ['my-revisit-reminder', 'a', 'f', 'id'];
    client.setQueryData(key, { profileName: 'Mẹ' });
    const query = client.getQueryCache().find({ queryKey: key })!;
    query.setState({ status: 'error', error: new Error('denied') });
    client.setQueryDefaults(['my-revisit-reminder'], { retryOnMount: false });
    let visible: unknown;
    function Probe() {
      visible = useMyRevisitReminder({ get: vi.fn() }, 'id', session).data;
      return null;
    }
    renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
    expect(visible).toBeUndefined();
    expect((query.options as { enabled?: boolean }).enabled).toBe(true);
    expect((query.options as { staleTime?: number }).staleTime).toBe(0);
    client.clear();
  });
});
