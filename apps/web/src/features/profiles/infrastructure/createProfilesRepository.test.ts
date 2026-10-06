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
  it('xác nhận chỉ gửi tư cách, giữ nguyên outcome yêu cầu lặp', async () => {
    const response = { outcome: 'already_confirmed', confirmedByDisplayName: 'An', profile: { id: 'p' } };
    const { repository, requests } = harness(200, response);
    await expect(repository.confirm('p', 'guardian', 'csrf')).resolves.toEqual(response);
    expect(new URL(requests[0]!.url).pathname).toBe('/api/health-profiles/p/consent');
    expect(await requests[0]!.json()).toEqual({ confirmedBy: 'guardian' });
    expect(requests[0]?.headers.get('X-CSRF-Token')).toBe('csrf');
  });
  it.each([401, 403, 409, 500])('HTTP %s không giả lập lưu thành công', async (status) => {
    const { repository } = harness(status, { error: { code: 'ERR_INTERNAL', message: 'SQL secret' } });
    await expect(repository.create({ displayName: 'Mẹ' }, 'csrf')).rejects.toMatchObject({ status });
    if (status === 500) await expect(repository.list()).rejects.not.toThrow('SQL secret');
  });
});
