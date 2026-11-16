import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { CURRENT_SESSION_KEY } from '@src/features/auth/application/useCurrentSession';
import { LocalPasswordPage } from './LocalPasswordPage';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  success: undefined as undefined | (() => Promise<unknown>),
}));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('react', async (original) => ({ ...(await original<typeof React>()), useEffect: vi.fn() }));
vi.mock('../application/useEnrollmentVerification', () => ({
  useEnrollmentVerification: () => ({ verified: true, expire: vi.fn() }),
}));
vi.mock('./EnrollmentPasswordForm', () => ({
  EnrollmentPasswordForm: ({ success }: { success: () => Promise<unknown> }) => {
    mocks.success = success;
    return <p>Đặt mật khẩu</p>;
  },
}));
const clients: QueryClient[] = [];
afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
  vi.clearAllMocks();
});
function renderPage(hasLocalCredential: boolean, adminWithoutFamily: boolean) {
  const client = new QueryClient();
  clients.push(client);
  client.setQueryData(CURRENT_SESSION_KEY, {
    account: { id: 'account', displayName: 'Lan', isSystemAdmin: adminWithoutFamily, healthProfileId: null },
    family: adminWithoutFamily ? null : { id: 'family', name: 'Nhà thử' },
    role: adminWithoutFamily ? null : 'main',
    csrfToken: 'csrf',
    authMethod: 'oidc',
    hasLocalCredential,
    features: { localEnrollmentEnabled: true, redactionSuggestions: false },
  });
  const effects: React.EffectCallback[] = [];
  vi.mocked(useEffect).mockImplementation((effect) => {
    effects.push(effect);
  });
  const markup = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <LocalPasswordPage />
    </QueryClientProvider>,
  );
  effects.forEach((effect) => effect());
  return { client, markup };
}
it('TC-900: admin OIDC chưa có mật khẩu mở thẳng enrollment về /admin và không thấy form', () => {
  const { markup } = renderPage(false, true);
  expect(markup).toBe('');
  expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith({ to: '/admin', replace: true });
});
it.each([true, false])(
  'TC-900: phiên đã có credential chọn thẳng đích ổn định, admin không nhà=%s',
  (admin) => {
    renderPage(true, admin);
    expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith({ to: admin ? '/admin' : '/', replace: true });
  },
);
it('TC-900: lưu thành công chỉ làm mới phiên, để effect sở hữu điều hướng', async () => {
  const { client } = renderPage(false, false);
  const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue();
  expect(mocks.success).toBeDefined();
  await mocks.success!();
  expect(invalidate).toHaveBeenCalledExactlyOnceWith({ queryKey: CURRENT_SESSION_KEY });
  expect(mocks.navigate).not.toHaveBeenCalled();
});
