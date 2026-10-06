import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthBoundary } from './AuthBoundary';
import type { components } from '@src/shared/api/schema.gen';

const waiting: components['schemas']['MeContextResponse'] = {
  account: { id: 'account', displayName: 'An', isSystemAdmin: false, healthProfileId: null },
  family: null,
  role: null,
  csrfToken: 'csrf',
};

vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => vi.fn(),
}));
const clients: QueryClient[] = [];
afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
});
function renderBoundary(data?: unknown) {
  const client = new QueryClient();
  clients.push(client);
  if (data !== undefined) client.setQueryData(['current-session'], data);
  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <AuthBoundary>
        <p>Nội dung gia đình</p>
      </AuthBoundary>
    </QueryClientProvider>,
  );
}
describe('Chặn nội dung trước khi kiểm tra phiên', () => {
  it('đang kiểm tra: chỉ hiện loading, chưa hiển thị trang chủ', () => {
    const html = renderBoundary();
    expect(html).toContain('Đang kiểm tra phiên');
    expect(html).not.toContain('Nội dung gia đình');
  });
  it('chưa có phiên: che nội dung trong lúc chuyển tới /login', () => {
    expect(renderBoundary(null)).not.toContain('Nội dung gia đình');
  });
  it('chưa có nhóm: che nội dung trong lúc chuyển tới /waiting', () => {
    expect(renderBoundary(waiting)).not.toContain('Nội dung gia đình');
  });
  it('đã có nhóm: hiển thị nội dung tuyến được yêu cầu', () => {
    expect(renderBoundary({ ...waiting, family: { id: 'family', name: 'Nhà An' }, role: 'main' })).toContain(
      'Nội dung gia đình',
    );
  });
});
