import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { createProfileLinkAdminRepository } from './createProfileLinkAdminRepository';
function harness(status: number, body: unknown) {
  const requests: Request[] = [];
  const client = createClient<paths>({
    baseUrl: 'https://sit.local',
    fetch: async (request) => {
      requests.push(request);
      return Response.json(body, { status });
    },
  });
  return { repo: createProfileLinkAdminRepository(client), requests };
}
describe('TC-562/563 — API chuyển liên kết của quản trị', () => {
  it('gửi accountId và CSRF; null là gỡ', async () => {
    const { repo, requests } = harness(200, { id: 'p', displayName: 'Mẹ', linkedAccount: null });
    await repo.setLinkedAccount('f', 'p', null, 'csrf');
    const request = requests[0]!;
    expect(request.method).toBe('PUT');
    expect(new URL(request.url).pathname).toBe('/api/admin/families/f/profiles/p/linked-account');
    expect(request.headers.get('X-CSRF-Token')).toBe('csrf');
    expect(await request.json()).toEqual({ accountId: null });
  });
  it('409 báo tài khoản đã liên kết, không giả lập thành công', async () => {
    const { repo } = harness(409, { error: { code: 'ERR_PROFILE_ALREADY_LINKED', message: 'x' } });
    await expect(repo.setLinkedAccount('f', 'p', 'n', 'csrf')).rejects.toThrow('đã liên kết với một hồ sơ');
  });
});
