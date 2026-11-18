import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
const state = vi.hoisted(() => ({ busy: false, error: null as string | null, closed: false }));
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, ...props }: ComponentProps<'a'> & { to: string }) => <a {...props} href={to} />,
}));
vi.mock('../application/useLoginForm', () => ({
  useLoginForm: () => ({
    form: { register: (name: string) => ({ name }), formState: { isSubmitting: state.busy } },
    submit: vi.fn(),
    error: state.error,
  }),
}));
vi.mock('../application/useRegistrationForm', () => ({
  useRegistrationForm: () => ({
    form: {
      register: (name: string) => ({ name }),
      watch: () => '',
      formState: { isSubmitting: state.busy, errors: {} },
    },
    submit: vi.fn(),
    error: state.error,
    legal: null,
    closed: state.closed,
    loadingLegal: false,
  }),
}));
afterEach(() => {
  Object.assign(state, { busy: false, error: null, closed: false });
});
function render(page: 'login' | 'register') {
  const client = new QueryClient();
  const html = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      {page === 'login' ? <LoginPage /> : <RegisterPage />}
    </QueryClientProvider>,
  );
  client.clear();
  return html;
}
it.each([
  ['login', 'Đang đăng nhập…'],
  ['register', 'Đang tạo tài khoản…'],
] as const)('màn %s đang gửi: khóa cả form, giữ nút và spinner 20 px', (page, label) => {
  state.busy = true;
  const html = render(page);
  expect(html).toContain('aria-busy="true"');
  expect(html).toContain('<fieldset disabled=""');
  expect(html).toContain(label);
  expect(html).toContain('h-5 w-5');
  expect(html).toMatch(/<button[^>]*(disabled=""[^>]*type="submit"|type="submit"[^>]*disabled="")/);
});
it.each(['login', 'register'] as const)('màn %s đặt lỗi chung ngay dưới nút, đúng catalog', (page) => {
  state.error = 'Bạn thao tác quá nhanh, vui lòng thử lại sau.';
  const html = render(page);
  expect(html).toContain('role="alert"');
  expect(html).toContain(state.error);
  expect(html.indexOf('role="alert"')).toBeGreaterThan(html.indexOf('type="submit"'));
});
it('TC-740: đăng ký đóng là khối thông tin ngay sau tiêu đề, không đỏ', () => {
  state.closed = true;
  const html = render('register');
  expect(html).toContain('Hiện chưa mở đăng ký. Bạn cần lời mời để tham gia.');
  const notice = html.slice(
    html.indexOf('role="status"'),
    html.indexOf('</p>', html.indexOf('role="status"')),
  );
  expect(notice).toContain('bg-bg');
  expect(notice).toContain('text-text-primary');
  expect(notice).not.toContain('danger');
  expect(html.indexOf('role="status"')).toBeLessThan(html.indexOf('<form'));
});
