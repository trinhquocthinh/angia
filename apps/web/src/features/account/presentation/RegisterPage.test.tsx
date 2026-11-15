import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { RegisterPage } from './RegisterPage';
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, ...props }: ComponentProps<'a'> & { to: string }) => <a {...props} href={to} />,
}));
it('đang tải legal: chưa có URL tự tạo, nút gửi vô hiệu và checkbox không tick sẵn', () => {
  const client = new QueryClient();
  const html = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <RegisterPage />
    </QueryClientProvider>,
  );
  expect(html).toContain('Tạo tài khoản');
  expect(html).toContain('autoComplete="new-password"');
  expect(html).toContain('Ít nhất 8 ký tự, khác tên đăng nhập.');
  expect(html).toContain('type="email"');
  expect(html).not.toContain('checked=""');
  expect(html).toMatch(/<button[^>]*(disabled=""[^>]*type="submit"|type="submit"[^>]*disabled="")/);
  expect(html).not.toContain('href="/legal/');
  client.clear();
});
