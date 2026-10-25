import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { logoutSession } from './logoutSession';

describe('Đăng xuất bằng phiên bảo mật hiện tại', () => {
  it.each([204, 401])('%s: hoàn tất đăng xuất, gửi CSRF và cookie cùng origin', async (status) => {
    const requests: Request[] = [];
    const client = createClient<paths>({
      baseUrl: 'http://localhost',
      credentials: 'same-origin',
      fetch: async (request) => {
        requests.push(request);
        return status === 204
          ? new Response(null, { status })
          : Response.json({ error: { code: 'ERR_UNAUTHENTICATED', message: '' } }, { status });
      },
    });
    await logoutSession('csrf-session', client);
    expect(requests[0]?.method).toBe('POST');
    expect(new URL(requests[0]!.url).pathname).toBe('/api/auth/logout');
    expect(requests[0]?.headers.get('X-CSRF-Token')).toBe('csrf-session');
    expect(requests[0]?.credentials).toBe('same-origin');
  });
  it('403: báo lỗi, không giả lập đã đăng xuất', async () => {
    const client = createClient<paths>({
      baseUrl: 'http://localhost',
      fetch: async () =>
        Response.json({ error: { code: 'ERR_FORBIDDEN', message: 'Internal' } }, { status: 403 }),
    });
    await expect(logoutSession('csrf', client)).rejects.toThrow('Không thể đăng xuất');
  });
  it('thiếu CSRF: không gửi HTTP', async () => {
    const requests: Request[] = [];
    const client = createClient<paths>({
      baseUrl: 'http://localhost',
      fetch: async (request) => {
        requests.push(request);
        return new Response(null, { status: 204 });
      },
    });
    await expect(logoutSession('', client)).rejects.toThrow();
    expect(requests).toHaveLength(0);
  });
});
