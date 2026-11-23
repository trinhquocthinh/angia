import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentProps } from 'react';
import { expect, it, vi } from 'vitest';
import { ChangePasswordPage } from './ChangePasswordPage';
import { LegalUpdatePage } from './LegalUpdatePage';
import { LocalPasswordPage } from './LocalPasswordPage';
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, ...props }: ComponentProps<'a'> & { to: string }) => <a {...props} href={to} />,
}));
function markup(page: React.ReactNode) {
  const client = new QueryClient();
  client.setQueryData(['current-session'], {
    account: { id: 'account', displayName: 'Lan', isSystemAdmin: false, healthProfileId: null },
    family: { id: 'family', name: 'Nhà thử', isOwner: false },
    role: 'main',
    authMethod: 'oidc',
    hasLocalCredential: false,
    emailStatus: { email: null, emailVerified: false, pendingEmail: null },
    features: { localEnrollmentEnabled: true },
  });
  const html = renderToStaticMarkup(<QueryClientProvider client={client}>{page}</QueryClientProvider>);
  client.clear();
  return html;
}
it('TC-748: thiếu CSRF chỉ mời đăng nhập lại', () => {
  const html = markup(<ChangePasswordPage />);
  expect(html).toContain('Vui lòng đăng nhập lại.');
  expect(html).toContain('href="/login"');
  expect(html).not.toContain('type="password"');
});
it('TC-755: màn legal có nội dung và chỉ một lựa chọn đăng xuất', () => {
  const html = markup(<LegalUpdatePage />);
  expect(html).toContain('Điều khoản đã thay đổi');
  expect(html).toContain('Nếu chưa muốn đồng ý');
  expect(html).not.toContain('Tải dữ liệu');
  expect(html).not.toContain('Xoá tài khoản');
});
it('TC-751: enrollment ban đầu cần xác minh và có Để sau', () => {
  const html = markup(<LocalPasswordPage />);
  expect(html).toContain('Xác minh lại');
  expect(html).toContain('Để sau');
  expect(html).not.toContain('Tên đăng nhập');
});
