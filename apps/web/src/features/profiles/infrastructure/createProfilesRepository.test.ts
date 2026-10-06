import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { createProfilesRepository } from './createProfilesRepository';
function harness(status = 200, body: unknown = []) {
  const requests: Request[] = [];
  const client = createClient<paths>({
    baseUrl: 'http://localhost',
    credentials: 'same-origin',
    fetch: async (request) => {
      requests.push(request);
      return Response.json(body, { status });
    },
  });
  return { repository: createProfilesRepository(client), requests };
}
describe('Hồ sơ qua hợp đồng HTTP và bảo vệ phiên', () => {
  it('danh sách và tài khoản liên kết không gửi familyId của client', async () => {
    const { repository, requests } = harness();
    await repository.list();
    await repository.linkableAccounts();
    expect(requests.map((request) => new URL(request.url).pathname)).toEqual([
      '/api/health-profiles',
      '/api/health-profiles/linkable-accounts',
    ]);
    expect(requests.every((request) => request.method === 'GET' && new URL(request.url).search === '')).toBe(
      true,
    );
  });
  it('tạo hồ sơ gửi đúng body, CSRF và cookie cùng origin', async () => {
    const { repository, requests } = harness(201, { id: 'p' });
    const body = { displayName: 'Mẹ', birthYear: 1954, linkedAccountId: 'a' };
    await repository.create(body, 'csrf');
    expect(requests[0]?.method).toBe('POST');
    expect(await requests[0]!.json()).toEqual(body);
    expect(requests[0]?.headers.get('X-CSRF-Token')).toBe('csrf');
    expect(requests[0]?.credentials).toBe('same-origin');
  });
  it('main tạo và thu hồi link bằng CSRF, không xác nhận thay người nhận', async () => {
    const { repository, requests } = harness(200, { token: 'opaque', expiresAt: '2026-10-13T00:00:00Z' });
    await repository.createInvitation('p', 'csrf');
    await repository.revokeInvitation('p', 'csrf');
    expect(requests.map((request) => request.method)).toEqual(['POST', 'DELETE']);
    expect(
      requests.every(
        (request) => new URL(request.url).pathname === '/api/health-profiles/p/consent-invitations',
      ),
    ).toBe(true);
    expect(requests.every((request) => request.headers.get('X-CSRF-Token') === 'csrf')).toBe(true);
    expect(requests[0]?.body).toBeNull();
  });
  it.each([401, 403, 409, 500])('HTTP %s không giả lập lưu thành công', async (status) => {
    const { repository } = harness(status, { error: { code: 'ERR_INTERNAL', message: 'SQL secret' } });
    await expect(repository.create({ displayName: 'Mẹ' }, 'csrf')).rejects.toMatchObject({ status });
    if (status === 500) await expect(repository.list()).rejects.not.toThrow('SQL secret');
  });
});
