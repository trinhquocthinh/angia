import { afterEach, expect, it, vi } from 'vitest';
import { accountRedirectMiddleware, registerAccountNavigator } from './accountRedirectMiddleware';

afterEach(() => {
  registerAccountNavigator(null);
  vi.unstubAllGlobals();
});
it.each([
  ['TC-748', 'ERR_PASSWORD_CHANGE_REQUIRED', '/account/change-password'],
  ['TC-752', 'ERR_LEGAL_ACCEPTANCE_REQUIRED', '/account/legal-update'],
])('%s: 403 chuyển đúng màn và giữ body cho caller', async (_, code, path) => {
  vi.stubGlobal('location', { pathname: '/' });
  const navigate = vi.fn();
  registerAccountNavigator(navigate);
  const response = Response.json({ error: { code } }, { status: 403 });
  await accountRedirectMiddleware.onResponse!({ response } as never);
  expect(navigate).toHaveBeenCalledWith(path);
  await expect(response.json()).resolves.toEqual({ error: { code } });
});
it('TC-748: không điều hướng lặp khi đã ở màn đích', async () => {
  vi.stubGlobal('location', { pathname: '/account/change-password' });
  const navigate = vi.fn();
  registerAccountNavigator(navigate);
  await accountRedirectMiddleware.onResponse!({
    response: Response.json({ error: { code: 'ERR_PASSWORD_CHANGE_REQUIRED' } }, { status: 403 }),
  } as never);
  expect(navigate).not.toHaveBeenCalled();
});
it.each(['/login', '/register'])(
  'TC-748: ở %s không đẩy về màn đổi mật khẩu để người mất token đăng nhập lại được',
  async (pathname) => {
    vi.stubGlobal('location', { pathname });
    const navigate = vi.fn();
    registerAccountNavigator(navigate);
    await accountRedirectMiddleware.onResponse!({
      response: Response.json({ error: { code: 'ERR_PASSWORD_CHANGE_REQUIRED' } }, { status: 403 }),
    } as never);
    expect(navigate).not.toHaveBeenCalled();
  },
);
it.each([
  Response.json({}, { status: 403 }),
  new Response('không phải JSON', { status: 403 }),
  Response.json({ error: { code: 'ERR_PASSWORD_CHANGE_REQUIRED' } }),
])('bỏ qua phản hồi khác và JSON lỗi', async (response) => {
  const navigate = vi.fn();
  registerAccountNavigator(navigate);
  await accountRedirectMiddleware.onResponse!({ response } as never);
  expect(navigate).not.toHaveBeenCalled();
});
it('TC-752: điều hướng thất bại vẫn giữ phản hồi lỗi cho caller', async () => {
  vi.stubGlobal('location', { pathname: '/' });
  registerAccountNavigator(async () => {
    throw new Error('navigation failed');
  });
  const response = Response.json({ error: { code: 'ERR_LEGAL_ACCEPTANCE_REQUIRED' } }, { status: 403 });
  await expect(accountRedirectMiddleware.onResponse!({ response } as never)).resolves.toBeUndefined();
  expect(response.bodyUsed).toBe(false);
});

it('TC-762: phiên hạn chế vẫn ở lại màn quên mật khẩu công khai', async () => {
  vi.stubGlobal('location', { pathname: '/forgot-password' });
  const navigate = vi.fn();
  registerAccountNavigator(navigate);
  await accountRedirectMiddleware.onResponse!({
    response: Response.json({ error: { code: 'ERR_PASSWORD_CHANGE_REQUIRED' } }, { status: 403 }),
  } as never);
  expect(navigate).not.toHaveBeenCalled();
});

it('TC-764: phiên hạn chế vẫn ở lại màn đặt lại mật khẩu công khai', async () => {
  vi.stubGlobal('location', { pathname: '/reset-password' });
  const navigate = vi.fn();
  registerAccountNavigator(navigate);
  await accountRedirectMiddleware.onResponse!({
    response: Response.json({ error: { code: 'ERR_PASSWORD_CHANGE_REQUIRED' } }, { status: 403 }),
  } as never);
  expect(navigate).not.toHaveBeenCalled();
});

it('TC-925: phiên hạn chế vẫn ở lại màn xác minh email công khai', async () => {
  vi.stubGlobal('location', { pathname: '/verify-email' });
  const navigate = vi.fn();
  registerAccountNavigator(navigate);
  await accountRedirectMiddleware.onResponse!({
    response: Response.json({ error: { code: 'ERR_PASSWORD_CHANGE_REQUIRED' } }, { status: 403 }),
  } as never);
  expect(navigate).not.toHaveBeenCalled();
});
