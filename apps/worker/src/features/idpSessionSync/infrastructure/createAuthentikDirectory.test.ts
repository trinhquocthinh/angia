import { describe, expect, it, vi } from 'vitest';
import { createAuthentikDirectory } from './createAuthentikDirectory.js';

const GROUP = 'angia-sit-users';
const member = {
  pk: 1,
  username: 'x',
  name: 'Người Thử',
  email: 'x@example.test',
  uid: 'u1',
  is_active: true,
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function directory(respond: () => Promise<Response>, baseUrl = 'https://auth.example.test') {
  const fetch = vi.fn<typeof globalThis.fetch>(respond);
  return { fetch, dir: createAuthentikDirectory({ baseUrl, token: 't', fetch }) };
}

describe('Adapter Authentik Admin API (SPEC-033)', () => {
  it('TC-331: phản hồi đúng → chỉ giữ uid/isActive; gọi đúng URL, Bearer, include_users=true', async () => {
    for (const baseUrl of ['https://auth.example.test', 'https://auth.example.test/']) {
      const { fetch, dir } = directory(
        async () => json({ results: [{ name: GROUP, users_obj: [member] }] }),
        baseUrl,
      );
      expect(await dir.fetchGroupMembers(GROUP)).toEqual([{ uid: 'u1', isActive: true }]);
      const [input, init] = fetch.mock.calls[0]!;
      const url = new URL(String(input));
      expect(`${url.origin}${url.pathname}`).toBe('https://auth.example.test/api/v3/core/groups/');
      expect(url.searchParams.get('name')).toBe(GROUP);
      expect(url.searchParams.get('include_users')).toBe('true');
      expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer t');
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    }
  });

  it('TC-331: lỗi HTTP, mạng, timeout, JSON sai dạng → đúng mã lý do', async () => {
    const timeout = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
    const cases: [() => Promise<Response>, object][] = [
      [async () => json({}, 401), { reason: 'idp_http_401' }],
      [async () => json({}, 403), { reason: 'idp_http_403' }],
      [async () => json({}, 502), { reason: 'idp_http_error', status: 502 }],
      [async () => Promise.reject(new TypeError('fetch failed')), { reason: 'idp_unreachable' }],
      [async () => Promise.reject(timeout), { reason: 'idp_timeout' }],
      [async () => new Response('<html>', { status: 200 }), { reason: 'idp_bad_response' }],
      [async () => json({ results: [{ name: GROUP, users_obj: null }] }), { reason: 'idp_bad_response' }],
      [
        async () => json({ results: [{ name: GROUP, users_obj: [{ ...member, uid: 7 }] }] }),
        { reason: 'idp_bad_response' },
      ],
    ];
    for (const [respond, expected] of cases)
      await expect(directory(respond).dir.fetchGroupMembers(GROUP)).rejects.toMatchObject(expected);
  });

  it('TC-331a: không có nhóm trùng tên tuyệt đối hoặc có hai nhóm trùng tên → group_not_found', async () => {
    const other = { name: `${GROUP}-old`, users_obj: [member] };
    for (const results of [
      [],
      [other],
      [
        { name: GROUP, users_obj: [] },
        { name: GROUP, users_obj: [] },
      ],
    ])
      await expect(
        directory(async () => json({ results })).dir.fetchGroupMembers(GROUP),
      ).rejects.toMatchObject({
        reason: 'group_not_found',
      });
    const mixed = directory(async () => json({ results: [other, { name: GROUP, users_obj: [] }] }));
    expect(await mixed.dir.fetchGroupMembers(GROUP)).toEqual([]);
  });

  it('TC-337: không theo chuyển hướng (token không bị gửi sang host khác)', async () => {
    const { fetch, dir } = directory(async () => json({ results: [{ name: GROUP, users_obj: [] }] }));
    await dir.fetchGroupMembers(GROUP);
    expect(fetch.mock.calls[0]?.[1]?.redirect).toBe('error');
  });

  it('TC-337: timeout khi đang đọc body → idp_timeout, không phải idp_bad_response', async () => {
    const timeout = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
    const slowBody = Object.assign(new Response(null, { status: 200 }), {
      json: () => Promise.reject(timeout),
    });
    await expect(directory(async () => slowBody).dir.fetchGroupMembers(GROUP)).rejects.toMatchObject({
      reason: 'idp_timeout',
    });
  });

  it('TC-331: lỗi không chứa phản hồi gốc của Authentik', async () => {
    const { dir } = directory(async () => new Response('secret-detail x@example.test', { status: 500 }));
    const error = await dir.fetchGroupMembers(GROUP).catch((caught: unknown) => caught);
    expect(String((error as Error).message)).not.toContain('example.test');
  });
});
