import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { familyId, policyInput, quota, view } from '../test/scanQuotaFixtures';
import { createScanQuotaRepository } from './createScanQuotaRepository';
function harness(status = 200, body: unknown = view) {
  const requests: Request[] = [];
  const client = createClient<paths>({
    baseUrl: 'http://localhost',
    credentials: 'same-origin',
    fetch: async (request) => {
      requests.push(request);
      return Response.json(body, { status });
    },
  });
  return { requests, repository: createScanQuotaRepository(client) };
}
describe('HTTP hạn mức lượt', () => {
  it('TC-589: GET quản trị và gia đình no-store, same-origin, signal hủy', async () => {
    for (const family of [false, true]) {
      const h = harness(200, family ? quota : view);
      const controller = new AbortController();
      expect(
        await (family ? h.repository.getFamily(controller.signal) : h.repository.getAdmin(controller.signal)),
      ).toEqual(family ? quota : view);
      expect(new URL(h.requests[0]!.url).pathname).toBe(
        family ? '/api/family/scan-quota' : '/api/admin/scan-quotas',
      );
      expect(h.requests[0]!.cache).toBe('no-store');
      expect(h.requests[0]!.credentials).toBe('same-origin');
      controller.abort();
      expect(h.requests[0]!.signal.aborted).toBe(true);
    }
  });
  it('TC-589: PUT/POST gửi đúng payload và CSRF', async () => {
    const h = harness();
    await h.repository.savePolicy(policyInput, 'csrf');
    const input = {
      month: view.month,
      expectedVersion: 7,
      grants: [{ familyId, status: 'approved' as const, grantedScans: 12, reason: 'Duyệt tháng' }],
    };
    await h.repository.grant(input, 'csrf');
    expect(h.requests.map((r) => r.method)).toEqual(['PUT', 'POST']);
    expect(h.requests.map((r) => new URL(r.url).pathname)).toEqual([
      '/api/admin/scan-quota-policy',
      '/api/admin/scan-quota-grants',
    ]);
    expect(h.requests.every((r) => r.headers.get('x-csrf-token') === 'csrf')).toBe(true);
    expect(await h.requests[0]!.json()).toEqual(policyInput);
    expect(await h.requests[1]!.json()).toEqual(input);
  });
  it('TC-589: input không đúng schema bị chặn trước mạng', async () => {
    const h = harness();
    await expect(
      h.repository.savePolicy({ ...policyInput, extra: true } as typeof policyInput, 'csrf'),
    ).rejects.toMatchObject({ code: 'ERR_VALIDATION' });
    await expect(
      h.repository.grant({ month: view.month, expectedVersion: 7, grants: [] }, 'csrf'),
    ).rejects.toMatchObject({ code: 'ERR_VALIDATION' });
    expect(h.requests).toHaveLength(0);
  });
  it.each([401, 403, 409, 500])('TC-589: lỗi %s cố định, không lộ SQL hoặc message', async (status) => {
    const h = harness(status, {
      error: { code: status === 409 ? 'ERR_SCAN_QUOTA_CONFLICT' : 'private_SQL', message: 'PRIVATE_SQL' },
    });
    await expect(h.repository.getAdmin()).rejects.toMatchObject({ status });
    await expect(h.repository.getAdmin()).rejects.not.toThrow(/PRIVATE_SQL|private_SQL/);
  });
  it('TC-589: lỗi HTTP sai cấu trúc vẫn dùng lỗi cố định', async () => {
    const h = harness(500, { message: 'PRIVATE_SQL' });
    await expect(h.repository.getAdmin()).rejects.toMatchObject({
      name: 'AdminRequestError',
      code: 'ERR_INTERNAL',
      status: 500,
    });
  });
  it('TC-589: output sai hoặc có thêm tiền phía gia đình không thành dữ liệu hợp lệ', async () => {
    await expect(harness(200, { ...quota, monthlyCapUsd: '5' }).repository.getFamily()).rejects.toMatchObject(
      { code: 'ERR_INTERNAL' },
    );
    await expect(harness(200, { ...view, runtimeActive: false }).repository.getAdmin()).rejects.toMatchObject(
      {
        code: 'ERR_INTERNAL',
      },
    );
  });
});
