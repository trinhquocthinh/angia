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
      return status === 204 ? new Response(null, { status }) : Response.json(body, { status });
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
  it('TC-558: xác nhận cam kết gửi endpoint mới, body và CSRF', async () => {
    const { repository, requests } = harness(200, { id: 'p' });
    const body = { kind: 'attestation', attestation: true, basis: 'guardian', respondentName: 'Mẹ' } as const;
    await repository.confirmConsent('p', body, 'csrf');
    expect(new URL(requests[0]!.url).pathname).toBe('/api/health-profiles/p/consent-attestation');
    expect(await requests[0]!.json()).toEqual(body);
    expect(requests[0]!.headers.get('X-CSRF-Token')).toBe('csrf');
  });
  it('TC-449 — sửa hồ sơ gửi PATCH đúng body, đường dẫn và CSRF', async () => {
    const { repository, requests } = harness(200, { id: 'p', birthYear: 2020, vitalsEnabled: null });
    const body = { birthYear: 2020, vitalsEnabled: false };
    expect(await repository.update('p', body, 'csrf')).toMatchObject({ birthYear: 2020 });
    expect(new URL(requests[0]!.url).pathname).toBe('/api/health-profiles/p');
    expect(requests[0]!.method).toBe('PATCH');
    expect(requests[0]!.headers.get('X-CSRF-Token')).toBe('csrf');
    expect(await requests[0]!.json()).toEqual(body);
  });
  it.each([401, 403, 404, 409, 422, 500])(
    'TC-449 — PATCH lỗi %s không báo lưu thành công',
    async (status) => {
      const { repository } = harness(status, { error: { code: 'ERR_VALIDATION' } });
      await expect(repository.update('p', { birthYear: 2020 }, 'csrf')).rejects.toMatchObject({ status });
    },
  );
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
    expect(await requests[0]!.clone().text()).toBe('{"attestation":true}');
  });
  it.each([401, 403, 409, 500])('HTTP %s không giả lập lưu thành công', async (status) => {
    const { repository } = harness(status, { error: { code: 'ERR_INTERNAL', message: 'SQL secret' } });
    await expect(repository.create({ displayName: 'Mẹ', birthYear: 1954 }, 'csrf')).rejects.toMatchObject({
      status,
    });
    if (status === 500) await expect(repository.list()).rejects.not.toThrow('SQL secret');
  });
  it('xóa hồ sơ gửi DELETE với tên nhập lại và CSRF; 422 trả mã không khớp', async () => {
    const ok = harness(204, null);
    ok.requests.length = 0;
    await ok.repository.remove('p', 'Mẹ', 'csrf');
    const request = ok.requests[0]!;
    expect(request.method).toBe('DELETE');
    expect(new URL(request.url).pathname).toBe('/api/health-profiles/p');
    expect(await request.json()).toEqual({ confirmName: 'Mẹ' });
    expect(request.headers.get('X-CSRF-Token')).toBe('csrf');
    const mismatch = harness(422, { error: { code: 'ERR_CONFIRMATION_MISMATCH', message: 'Sai' } });
    await expect(mismatch.repository.remove('p', 'me', 'csrf')).rejects.toMatchObject({
      status: 422,
      code: 'ERR_CONFIRMATION_MISMATCH',
    });
  });
});
