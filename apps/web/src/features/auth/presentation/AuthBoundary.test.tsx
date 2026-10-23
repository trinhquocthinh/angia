import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import type * as React from 'react';
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

const router = vi.hoisted(() => ({ pathname: '/', navigate: vi.fn() }));
vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: router.pathname }),
  useNavigate: () => router.navigate,
}));
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof React>()),
  useEffect: vi.fn(),
}));
vi.mock('@src/features/pushSubscriptions/infrastructure/syncBrowserPush', () => ({
  syncBrowserPush: async () => undefined,
}));
const clients: QueryClient[] = [];
afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
  router.pathname = '/';
  vi.clearAllMocks();
  vi.unstubAllGlobals();
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
    expect(html).toContain('Đang kiểm tra trạng thái đăng nhập');
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

const reminderPath = '/reminders/3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b';
const member = { ...waiting, family: { id: 'family', name: 'Nhà An' }, role: 'member' };
function stubSessionStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  });
  return data;
}
function renderWithEffects(data: unknown) {
  const effects: Array<() => void | (() => void)> = [];
  vi.mocked(useEffect).mockImplementation((effect) => {
    effects.push(effect);
  });
  const html = renderBoundary(data);
  for (const effect of effects) effect();
  return html;
}
describe('Quay lại lời nhắc sau đăng nhập (SPEC-035)', () => {
  it('chưa có phiên tại /reminders/<uuid>: lưu đường dẫn rồi chuyển /login', () => {
    const storage = stubSessionStorage();
    router.pathname = reminderPath;
    renderWithEffects(null);
    expect(storage.get('angia.returnTo')).toBe(reminderPath);
    expect(router.navigate).toHaveBeenCalledWith({ to: '/login', replace: true });
  });
  it('có phiên và gia đình tại /: điều hướng về lời nhắc đã lưu và xóa đường dẫn', () => {
    const storage = stubSessionStorage({ 'angia.returnTo': reminderPath });
    renderWithEffects(member);
    expect(router.navigate).toHaveBeenCalledWith({ to: reminderPath, replace: true });
    expect(storage.has('angia.returnTo')).toBe(false);
  });
  it('thành viên đã có gia đình mở thẳng /reminders/<uuid>: không bị chuyển hướng', () => {
    stubSessionStorage();
    router.pathname = reminderPath;
    expect(renderWithEffects(member)).toContain('Nội dung gia đình');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
