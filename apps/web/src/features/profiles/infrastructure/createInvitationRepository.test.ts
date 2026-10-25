import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { createInvitationRepository } from './createInvitationRepository';
function harness(status = 200) {
  const requests: Request[] = [];
  const client = createClient<paths>({
    baseUrl: 'https://sit.local',
    credentials: 'omit',
    fetch: async (request) => {
      requests.push(request);
      return Response.json(status === 200 ? { status: 'pending' } : { error: { message: 'secret-token' } }, {
        status,
      });
    },
  });
  return { repo: createInvitationRepository(client), requests };
}
describe('API lời mời không cần phiên, không lộ token qua URL/cookie', () => {
  it('GET chỉ xem với Bearer, no-store/no-referrer, không consume', async () => {
    const { repo, requests } = harness();
    await repo.view('opaque');
    const request = requests[0]!;
    expect(request.url).toBe('https://sit.local/api/consent-invitations/view');
    expect(request.headers.get('Authorization')).toBe('Bearer opaque');
    expect(request.credentials).toBe('omit');
    expect(request.cache).toBe('no-store');
    expect(request.referrerPolicy).toBe('no-referrer');
    expect(request.method).toBe('GET');
  });
  it('POST giữ quyết định rõ ràng, browser tự đặt Origin, không dùng CSRF/cookie', async () => {
    const { repo, requests } = harness();
    const body = { respondentName: 'An', basis: 'guardian' as const, decision: 'declined' as const };
    await repo.respond('opaque', body);
    const request = requests[0]!;
    expect(request.method).toBe('POST');
    expect(await request.json()).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer opaque');
    expect(request.headers.has('X-CSRF-Token')).toBe(false);
    expect(request.headers.has('Origin')).toBe(false);
    expect(request.credentials).toBe('omit');
  });
  it.each([404, 500])('HTTP %s không đưa token hoặc lỗi server vào UI', async (status) => {
    const { repo } = harness(status);
    await expect(repo.view('opaque')).rejects.not.toThrow('secret-token');
  });
});
