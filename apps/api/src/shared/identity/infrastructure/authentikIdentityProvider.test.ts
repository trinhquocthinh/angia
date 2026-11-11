import { describe, expect, it, vi } from 'vitest';
import { createAuthentikIdentityProvider } from './authentikIdentityProvider.js';

const group = '11111111-1111-4111-8111-111111111111';
const user = { pk: 42, uid: 'identity-42', username: 'spike-test', groups: [group] };
const json = (body: unknown, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers });

function setup(responses: Response[]) {
  const fetch = vi.fn<typeof globalThis.fetch>();
  for (const response of responses) fetch.mockResolvedValueOnce(response);
  const provider = createAuthentikIdentityProvider({
    apiUrl: 'https://auth.example.invalid/api/v3/',
    token: 'service-secret',
    groupName: 'angia-sit-users',
    flowSlug: 'spike-login',
    fetch,
  });
  return { provider, fetch };
}

describe('Adapter Authentik thử nghiệm', () => {
  it('TC-873 tạo user trong đúng nhóm rồi đặt mật khẩu', async () => {
    const { provider, fetch } = setup([
      json({ results: [{ pk: group, name: 'angia-sit-users' }] }),
      json(user, 201),
      new Response(null, { status: 204 }),
    ]);
    expect(await provider.createUser('spike-test', 'secret-password')).toEqual(user);
    expect(JSON.parse(String(fetch.mock.calls[1]?.[1]?.body))).toEqual({
      username: 'spike-test',
      name: 'Tài khoản thử spike',
      groups: [group],
      is_active: true,
    });
    expect(String(fetch.mock.calls[2]?.[0])).toContain('/core/users/42/set_password/');
    expect(new Headers(fetch.mock.calls[2]?.[1]?.headers).get('Authorization')).toBe('Bearer service-secret');
  });

  it('TC-873 xoá user vừa tạo khi đặt mật khẩu lỗi', async () => {
    const { provider, fetch } = setup([
      json({ results: [{ pk: group, name: 'angia-sit-users' }] }),
      json(user, 201),
      json({ secret: 'không được lộ' }, 403),
      new Response(null, { status: 204 }),
    ]);
    await expect(provider.createUser('spike-test', 'password')).rejects.toThrow('idp_http_403');
    expect(fetch.mock.calls[3]?.[1]?.method).toBe('DELETE');
  });

  it('TC-873 không tạo user khi nhóm không khớp chính xác', async () => {
    const { provider, fetch } = setup([json({ results: [{ pk: group, name: 'angia-prod-users' }] })]);
    await expect(provider.createUser('spike-test', 'password')).rejects.toThrow('idp_group_not_found');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('TC-873 giữ cookie/CSRF và xác nhận danh tính sau flow, không gửi token dịch vụ', async () => {
    const { provider, fetch } = setup([
      json({ component: 'ak-stage-identification' }, 200, {
        'Set-Cookie': 'authentik_csrf=csrf-value; Path=/; Secure',
      }),
      json({ component: 'ak-stage-password' }, 200, {
        'Set-Cookie': 'sessionid=flow-session; Path=/; Secure',
      }),
      json({ component: 'xak-flow-redirect', to: 'https://other.invalid/' }),
      json({ user: { ...user, is_active: true } }),
    ]);
    expect(await provider.verifyPassword('spike-test', 'password')).toBe('identity-42');
    expect(JSON.parse(String(fetch.mock.calls[1]?.[1]?.body))).toEqual({
      component: 'ak-stage-identification',
      uid_field: 'spike-test',
    });
    const headers = new Headers(fetch.mock.calls[2]?.[1]?.headers);
    expect(headers.get('Cookie')).toContain('sessionid=flow-session');
    expect(headers.get('X-authentik-CSRF')).toBe('csrf-value');
    expect(JSON.parse(String(fetch.mock.calls[2]?.[1]?.body))).toEqual({
      component: 'ak-stage-password',
      password: 'password',
    });
    for (const [, init] of fetch.mock.calls) {
      expect(new Headers(init?.headers).has('Authorization')).toBe(false);
      expect(init?.redirect).toBe('manual');
    }
    expect(String(fetch.mock.calls[3]?.[0])).toContain('/core/users/me/');
  });

  it('TC-873 hỗ trợ nhận diện kèm mật khẩu trong một stage', async () => {
    const { provider, fetch } = setup([
      json({ component: 'ak-stage-identification', password_fields: true }),
      json({ component: 'xak-flow-redirect' }),
      json({ user: { ...user, is_active: true } }),
    ]);
    await provider.verifyPassword('spike-test', 'password');
    expect(JSON.parse(String(fetch.mock.calls[1]?.[1]?.body)).password).toBe('password');
  });

  it('TC-873 từ chối mật khẩu sai khi challenge chứa lỗi', async () => {
    const { provider } = setup([
      json({ component: 'ak-stage-identification' }),
      json({ component: 'ak-stage-password', response_errors: { password: [{ code: 'invalid' }] } }),
      json({ results: [] }),
    ]);
    await expect(provider.verifyPassword('spike-test', 'wrong')).rejects.toThrow('idp_invalid_credentials');
  });

  it.each(['ak-stage-authenticator-totp', 'ak-stage-consent', 'ak-stage-access-denied'])(
    'TC-873 không coi stage %s là xác thực thành công',
    async (component) => {
      const { provider } = setup([json({ component })]);
      await expect(provider.verifyPassword('spike-test', 'password')).rejects.toThrow();
    },
  );

  it('TC-873 redirect hoàn tất không đủ nếu chưa kiểm mật khẩu', async () => {
    const { provider } = setup([json({ component: 'xak-flow-redirect' })]);
    await expect(provider.verifyPassword('spike-test', 'password')).rejects.toThrow('idp_unverified_flow');
  });

  it('TC-873 từ chối phiên trả về danh tính khác', async () => {
    const { provider } = setup([
      json({ component: 'ak-stage-password' }),
      json({ component: 'xak-flow-redirect' }),
      json({ user: { ...user, username: 'someone-else', is_active: true } }),
    ]);
    await expect(provider.verifyPassword('spike-test', 'password')).rejects.toThrow('idp_identity_mismatch');
  });

  it('TC-873 không gửi cookie theo redirect ra ngoài executor', async () => {
    const { provider, fetch } = setup([
      new Response(null, { status: 302, headers: { Location: 'https://other.invalid/' } }),
    ]);
    await expect(provider.verifyPassword('spike-test', 'password')).rejects.toThrow('idp_unsafe_redirect');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('TC-875 timeout trả mã hạ tầng, không lộ lỗi gốc', async () => {
    const { provider, fetch } = setup([]);
    fetch.mockRejectedValue(new DOMException('service-secret', 'TimeoutError'));
    await expect(provider.verifyPassword('spike-test', 'password')).rejects.toThrow('idp_timeout');
  });

  it('TC-873 từ chối JSON hỏng', async () => {
    const { provider } = setup([new Response('secret-response')]);
    await expect(provider.verifyPassword('spike-test', 'password')).rejects.toThrow('idp_bad_response');
  });
});
