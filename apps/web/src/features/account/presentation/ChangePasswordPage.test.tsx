import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import type { useNewPasswordForm } from '../application/useNewPasswordForm';
import { ChangePasswordPage } from './ChangePasswordPage';

const callbacks = vi.hoisted(() => ({
  success: undefined as Parameters<typeof useNewPasswordForm>[3] | undefined,
  failure: undefined as Parameters<typeof useNewPasswordForm>[4],
}));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../application/useNewPasswordForm', () => ({
  useNewPasswordForm: (...args: Parameters<typeof useNewPasswordForm>) => {
    callbacks.success = args[3];
    callbacks.failure = args[4];
    return { form: { formState: {} }, submit: vi.fn(), error: null };
  },
}));
vi.mock('./NewPasswordFields', () => ({ NewPasswordFields: () => null }));
vi.mock('./AccountLogout', () => ({ AccountLogout: () => null }));
afterEach(() => vi.unstubAllGlobals());

function renderPage(name: string | null) {
  const values = new Map([['angia.restrictedCsrf', 'csrf']]);
  if (name !== null) values.set('angia.passwordResetBy', name);
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
  });
  const client = new QueryClient();
  const html = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <ChangePasswordPage />
    </QueryClientProvider>,
  );
  client.clear();
  return { html, values };
}
it('TC-748: hiển thị tên người đặt lại dưới dạng văn bản được escape', () => {
  const { html } = renderPage('<b>Thịnh</b>');
  expect(html).toContain('Mật khẩu của bạn đã được &lt;b&gt;Thịnh&lt;/b&gt; đặt lại.');
  expect(html).not.toContain('<b>Thịnh</b>');
});
it('TC-748: không có tên vẫn hiển thị lời nhắc cũ', () => {
  expect(renderPage(null).html).toContain(
    'Mật khẩu của bạn đã được đặt lại. Hãy đặt mật khẩu mới để tiếp tục.',
  );
});
it('TC-748: đổi mật khẩu thành công xoá tên và CSRF phiên hạn chế', async () => {
  const { values } = renderPage('Thịnh');
  await callbacks.success!();
  expect(values.has('angia.restrictedCsrf')).toBe(false);
  expect(values.has('angia.passwordResetBy')).toBe(false);
});
it('TC-748: phiên hết hạn xoá tên và CSRF phiên hạn chế', () => {
  const { values } = renderPage('Thịnh');
  expect(callbacks.failure!({ ok: false, code: 'ERR_UNAUTHENTICATED', status: 401 })).toBe(true);
  expect(values.has('angia.restrictedCsrf')).toBe(false);
  expect(values.has('angia.passwordResetBy')).toBe(false);
});
