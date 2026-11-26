import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { ThemeProvider } from '@src/shared/theme/ThemeProvider';
import { ProfileFrame } from './ProfileFrame';
import { AccountMenuPanel } from './AccountMenuPanel';
import type { ProfileSession } from '../../application/ports';

const state = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: state.pathname }),
  useNavigate: () => vi.fn(),
  Link: ({
    to,
    activeOptions: _options,
    activeProps: _active,
    inactiveProps: _idle,
    ...props
  }: ComponentProps<'a'> & {
    to: string;
    activeOptions?: unknown;
    activeProps?: unknown;
    inactiveProps?: unknown;
  }) => <a {...props} href={to} />,
}));
const session: ProfileSession = {
  account: { id: 'account', displayName: 'Lan', isSystemAdmin: false, healthProfileId: null },
  family: null,
  role: null,
  csrfToken: 'csrf',
  authMethod: 'local',
  hasLocalCredential: true,
  emailStatus: { email: null, emailVerified: false, pendingEmail: null },
  features: { redactionSuggestions: false, localEnrollmentEnabled: false },
};
function render(current: ProfileSession, path: string) {
  state.pathname = path;
  const client = new QueryClient();
  const html = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <ProfileFrame
        session={current}
        profiles={[]}
        logout={{ isPending: false, isError: false, mutate: vi.fn() }}
      >
        Nội dung
      </ProfileFrame>
    </QueryClientProvider>,
  );
  client.clear();
  return html;
}
it('TC-767: chưa có nhà không hiện search hoặc điều hướng chính', () => {
  const html = render(session, '/waiting');
  expect(html).not.toContain('Điều hướng chính');
  expect(html).not.toContain('Tìm hồ sơ thành viên');
  expect(html).toContain('Chưa có nhà');
});
it.each(['main', 'member'] as const)('TC-767: đã có nhà giữ điều hướng cho vai trò %s', (role) => {
  const html = render(
    {
      ...session,
      role,
      family: { id: 'family', name: 'Nhà Lan', isOwner: false },
      account: { ...session.account, healthProfileId: role === 'member' ? 'profile' : null },
    },
    '/',
  );
  expect(html).toContain('Điều hướng chính');
});
it('TC-767: member chưa liên kết có ba mục điều hướng và không tìm hồ sơ', () => {
  const html = render(
    { ...session, role: 'member', family: { id: 'family', name: 'Nhà Lan', isOwner: false } },
    '/',
  );
  expect(html).toContain('Điều hướng chính');
  expect(html).toContain('href="/family/home"');
  expect(html).toContain('href="/my-profile"');
  expect(html).not.toContain('href="/review"');
  expect(html).not.toContain('Tìm hồ sơ thành viên');
});
it('TC-767: trang admin không hiện ba tab dù admin đang có nhà', () => {
  const html = render(
    {
      ...session,
      role: 'main',
      family: { id: 'family', name: 'Nhà Lan', isOwner: false },
      account: { ...session.account, isSystemAdmin: true },
    },
    '/admin',
  );
  expect(html).not.toContain('Điều hướng chính');
});
it('TC-767: menu chỉ có một mục hồ sơ và bỏ cài đặt gia đình', () => {
  const html = renderToStaticMarkup(
    <ThemeProvider>
      <AccountMenuPanel
        session={{ ...session, account: { ...session.account, healthProfileId: 'profile' } }}
        pending={false}
        error={false}
        onLogout={vi.fn()}
      />
    </ThemeProvider>,
  );
  expect(html.match(/href="\/my-profile"/g)).toHaveLength(1);
  expect(html).toContain('href="/my-profile"');
  expect(html).toContain('Quản lý tài khoản');
  expect(html).toContain('href="/account"');
  expect(html.indexOf('Quản lý tài khoản')).toBeLessThan(html.indexOf('Đăng xuất'));
  expect(html).not.toContain('Hồ sơ cá nhân');
  expect(html).not.toContain('Cài đặt gia đình');
  expect(html).not.toContain('Nền giao diện');
  expect(html).not.toContain('type="radio"');
});
it('TC-925: menu tài khoản luôn có mục Quản lý tài khoản trước Đăng xuất dù chưa có nhà', () => {
  const html = renderToStaticMarkup(
    <ThemeProvider>
      <AccountMenuPanel session={session} pending={false} error={false} onLogout={vi.fn()} />
    </ThemeProvider>,
  );
  expect(html).toContain('Quản lý tài khoản');
  expect(html).toContain('href="/account"');
  expect(html.indexOf('Quản lý tài khoản')).toBeLessThan(html.indexOf('Đăng xuất'));
});
