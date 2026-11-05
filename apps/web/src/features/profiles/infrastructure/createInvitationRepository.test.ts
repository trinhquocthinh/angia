import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { createInvitationRepository } from './createInvitationRepository';
function harness(status = 200) {
  const requests: Request[] = [];
  const client = createClient<paths>({
    baseUrl: 'https://sit.local',
    credentials: 'same-origin',
    fetch: async (request) => {
      requests.push(request);
      return Response.json(status === 200 ? { canAccept: true } : { error: { message: 'secret-token' } }, {
        status,
      });
    },
  });
  return { repo: createInvitationRepository(client), requests };
}
describe('SPEC-040 — API link liên kết cần phiên, token không qua URL', () => {
  it('GET gửi Bearer, no-store/no-referrer, kèm cookie phiên', async () => {
    const { repo, requests } = harness();
    await repo.view('opaque');
    const request = requests[0]!;
    expect(request.url).toBe('https://sit.local/api/me/link-invitations/view');
    expect(request.headers.get('Authorization')).toBe('Bearer opaque');
    expect(request.credentials).toBe('same-origin');
    expect(request.cache).toBe('no-store');
    expect(request.referrerPolicy).toBe('no-referrer');
  });
  it('POST gửi quyết định, Bearer và CSRF', async () => {
    const { repo, requests } = harness();
    await repo.respond('opaque', 'declined', 'csrf');
    const request = requests[0]!;
    expect(request.url).toBe('https://sit.local/api/me/link-invitations/accept');
    expect(request.method).toBe('POST');
    expect(await request.json()).toEqual({ decision: 'declined' });
    expect(request.headers.get('Authorization')).toBe('Bearer opaque');
    expect(request.headers.get('X-CSRF-Token')).toBe('csrf');
  });
  it.each([404, 500])('HTTP %s không đưa token hoặc lỗi server vào UI', async (status) => {
    const { repo } = harness(status);
    await expect(repo.view('opaque')).rejects.toMatchObject({ status });
    await expect(repo.view('opaque')).rejects.not.toThrow('secret-token');
  });
});
