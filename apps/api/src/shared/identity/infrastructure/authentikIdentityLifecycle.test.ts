import { expect, it, vi } from 'vitest';
import { createAuthentikIdentityProvider } from './authentikIdentityProvider.js';

function setup(responses: Response[]) {
  const fetch = vi.fn<typeof globalThis.fetch>();
  for (const response of responses) fetch.mockResolvedValueOnce(response);
  return {
    fetch,
    provider: createAuthentikIdentityProvider({
      apiUrl: 'https://auth.example.invalid/api/v3/',
      token: 'secret',
      groupName: 'angia-sit-users',
      flowSlug: 'login',
      fetch,
    }),
  };
}

it('TC-873 đặt mật khẩu mới và khoá/mở đúng user', async () => {
  const { provider, fetch } = setup([
    new Response(null, { status: 204 }),
    Response.json({ pk: 42, is_active: false }),
    Response.json({ pk: 42, is_active: true }),
  ]);
  await provider.setPassword(42, 'new-password');
  await provider.lock(42);
  await provider.unlock(42);
  expect(
    fetch.mock.calls.map(([url, init]) => [String(url), init?.method, JSON.parse(String(init?.body))]),
  ).toEqual([
    ['https://auth.example.invalid/api/v3/core/users/42/set_password/', 'POST', { password: 'new-password' }],
    ['https://auth.example.invalid/api/v3/core/users/42/', 'PATCH', { is_active: false }],
    ['https://auth.example.invalid/api/v3/core/users/42/', 'PATCH', { is_active: true }],
  ]);
});

it('TC-873 không báo khoá thành công nếu phản hồi chưa khoá', async () => {
  const { provider } = setup([Response.json({ pk: 42, is_active: true })]);
  await expect(provider.lock(42)).rejects.toThrow('idp_bad_response');
});

it('TC-874 chỉ ánh xạ lỗi khoá sau khi flow thực sự từ chối đăng nhập', async () => {
  const { provider, fetch } = setup([
    Response.json({ component: 'ak-stage-identification' }),
    Response.json({ component: 'ak-stage-password', response_errors: { password: [{ code: 'invalid' }] } }),
    Response.json({ results: [{ username: 'spike-test', is_active: false }] }),
  ]);
  await expect(provider.verifyPassword('spike-test', 'correct')).rejects.toThrow('ERR_ACCOUNT_LOCKED');
  expect(String(fetch.mock.calls[0]?.[0])).toContain('/flows/executor/');
  expect(String(fetch.mock.calls[2]?.[0])).toContain('username=spike-test');
});

it('TC-874 không coi flow đăng nhập thành công là bị khoá', async () => {
  const { provider, fetch } = setup([
    Response.json({ component: 'ak-stage-password' }),
    Response.json({ component: 'xak-flow-redirect' }),
    Response.json({ user: { uid: 'uid-42', username: 'spike-test', is_active: true } }),
  ]);
  expect(await provider.verifyPassword('spike-test', 'correct')).toBe('uid-42');
  expect(fetch).toHaveBeenCalledTimes(3);
});

it('TC-874 giữ lỗi mật khẩu sai nếu user vẫn hoạt động', async () => {
  const { provider } = setup([
    Response.json({ component: 'ak-stage-password', response_errors: { password: [{ code: 'invalid' }] } }),
    Response.json({ results: [{ username: 'spike-test', is_active: true }] }),
  ]);
  await expect(provider.verifyPassword('spike-test', 'wrong')).rejects.toThrow('idp_invalid_credentials');
});

it('TC-875 timeout không bị ánh xạ nhầm thành khoá', async () => {
  const { provider, fetch } = setup([]);
  fetch.mockRejectedValue(new DOMException('secret', 'TimeoutError'));
  await expect(provider.verifyPassword('spike-test', 'password')).rejects.toThrow('idp_timeout');
  expect(fetch).toHaveBeenCalledTimes(1);
});
