import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { useCurrentSession } from './useCurrentSession';

describe('Theo dõi phiên hiện hành', () => {
  it('lần đầu chưa có phản hồi: giữ trạng thái đang tải', () => {
    const client = new QueryClient();
    const fetchSession = vi.fn(async () => null);
    function Probe() {
      const session = useCurrentSession(fetchSession);
      return <span>{session.isPending ? 'Đang tải' : 'Đã tải'}</span>;
    }
    const html = renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
    expect(html).toContain('Đang tải');
    expect(fetchSession).not.toHaveBeenCalled();
    const query = client.getQueryCache().find({ queryKey: ['current-session'] });
    expect(query?.options.retry).toBe(false);
    client.clear();
  });
  it('phản hồi 401 đã được đọc: null là dữ liệu thành công, không phải loading', () => {
    const client = new QueryClient();
    client.setQueryData(['current-session'], null);
    function Probe() {
      const session = useCurrentSession(async () => null);
      return <span>{session.isSuccess && session.data === null ? 'Chưa có phiên' : 'Đang tải'}</span>;
    }
    const html = renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
    expect(html).toContain('Chưa có phiên');
    client.clear();
  });
});
