import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentProps } from 'react';
import { expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, ...props }: ComponentProps<'a'> & { to: string }) => <a {...props} href={to} />,
}));
it('có form local, liên kết công khai và lỗi OIDC ngay dưới nút', () => {
  const client = new QueryClient();
  const html = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <LoginPage hasAuthError />
    </QueryClientProvider>,
  );
  expect(html).toContain('Tên đăng nhập hoặc email');
  expect(html).toContain('placeholder="Nhập tên đăng nhập hoặc email đã xác minh"');
  expect(html).toContain('autoComplete="username"');
  expect(html).toContain('autoComplete="current-password"');
  expect(html).toContain('aria-busy="false"');
  expect(html).toContain('href="/register"');
  expect(html).toContain('href="/forgot-password"');
  expect(html).toContain('href="/api/auth/login"');
  expect(html).toContain('Đăng nhập bằng Authentik');
  for (const name of ['medication', 'heart', 'family', 'lock', 'user', 'key']) {
    expect(html).toContain(`/images/login/clay/desktop-${name}.svg`);
  }
  for (const name of ['lock', 'user', 'key']) {
    expect(html).toContain(`/images/login/clay/mobile-${name}.svg`);
  }
  expect(html).not.toContain('type="checkbox"');
  expect(html).not.toContain('Sinh trắc');
  expect(html).not.toContain('Số điện thoại');
  expect(html.indexOf('role="alert"')).toBeGreaterThan(html.indexOf('type="submit"'));
  expect(html).toContain('Không thể xác thực tài khoản. Vui lòng thử lại.');
  expect(html).not.toContain('Đăng nhập an toàn');
  client.clear();
});
