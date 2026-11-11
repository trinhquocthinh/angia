import { expect, it, vi } from 'vitest';
import { createAuthentikRequest } from './createAuthentikRequest.js';

const settings = {
  apiUrl: 'https://auth.example.invalid/api/v3/',
  token: 'secret',
  groupName: 'angia-sit-users',
  flowSlug: 'login',
};

it('TC-873 chỉ theo 302 nội bộ cùng executor và giữ cookie', async () => {
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: {
          Location: '/api/v3/flows/executor/login/',
          'Set-Cookie': 'sessionid=one; Path=/',
        },
      }),
    )
    .mockResolvedValueOnce(Response.json({ component: 'ak-stage-password' }));
  expect(
    await createAuthentikRequest({ ...settings, fetch }, false)('flows/executor/login/', 'POST', {}),
  ).toEqual({ component: 'ak-stage-password' });
  expect(fetch.mock.calls[1]?.[1]?.method).toBe('GET');
  expect(fetch.mock.calls[1]?.[1]?.body).toBeUndefined();
  expect(new Headers(fetch.mock.calls[1]?.[1]?.headers).get('Cookie')).toBe('sessionid=one');
});

it('TC-873 không theo redirect của API quản trị', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
    new Response(null, {
      status: 302,
      headers: { Location: 'https://other.invalid/' },
    }),
  );
  await expect(createAuthentikRequest({ ...settings, fetch }, true)('core/groups/')).rejects.toThrow(
    'idp_unsafe_redirect',
  );
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('TC-873 mỗi lần kiểm mật khẩu có cookie jar độc lập', async () => {
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockResolvedValueOnce(Response.json({}, { headers: { 'Set-Cookie': 'sessionid=one; Path=/' } }))
    .mockResolvedValueOnce(Response.json({}));
  await createAuthentikRequest({ ...settings, fetch }, false)('flows/executor/login/');
  await createAuthentikRequest({ ...settings, fetch }, false)('flows/executor/login/');
  expect(new Headers(fetch.mock.calls[1]?.[1]?.headers).has('Cookie')).toBe(false);
});

it('TC-873 dừng executor chuyển hướng lặp vô hạn', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(
    async () =>
      new Response(null, {
        status: 302,
        headers: { Location: '/api/v3/flows/executor/login/' },
      }),
  );
  await expect(
    createAuthentikRequest({ ...settings, fetch }, false)('flows/executor/login/'),
  ).rejects.toThrow('idp_flow_limit');
  expect(fetch).toHaveBeenCalledTimes(10);
});

it('TC-875 timeout khi đang đọc body vẫn là lỗi hạ tầng', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async (_url, init) => {
    const response = Response.json({});
    vi.spyOn(response, 'json').mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
        }),
    );
    return response;
  });
  await expect(
    createAuthentikRequest({ ...settings, fetch, timeoutMs: 10 }, false)('flows/executor/login/'),
  ).rejects.toThrow('idp_timeout');
});
