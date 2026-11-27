import type { InvitationInspectionRepository } from '../application/inspectionPorts.js';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@src/createApp.js';
import { createStubAuthDeps } from '@src/shared/test/createStubAuthDeps.js';
import { createStubReviewDeps } from '@src/shared/test/createStubReviewDeps.js';
import { createStubDocumentDeps } from '@src/shared/test/createStubDocumentDeps.js';
import { createStubProfileDeps } from '@src/shared/test/createStubProfileDeps.js';
import { createStubProfileLinkDeps } from '@src/shared/test/createStubProfileLinkDeps.js';
import { createFakeFamilyAdminRepository } from '@src/shared/test/createFakeFamilyAdminRepository.js';
import { createStubAiBudgetDeps } from '@src/shared/test/createStubAiBudgetDeps.js';

function fixture() {
  const deps = createStubReviewDeps();
  const auth = createStubAuthDeps();
  const verify = vi.fn<InvitationInspectionRepository['verify']>(async (_token: string) => ({
    kind: 'join_family' as const,
    role: 'member' as const,
    familyId: 'bí mật',
  }));
  const buckets = new Map<string, number>();
  let now = 0;
  deps.invitationAcceptance.inspection = { verify };
  deps.account.clientIp = (c) => c.req.header('x-test-ip') ?? 'ip-1';
  deps.account.rateLimit = {
    keyHasher: (kind, key) => `${kind}:${key}`,
    now: () => now,
    store: {
      increment: async (key, start) => {
        const bucket = `${key}:${start}`;
        const count = (buckets.get(bucket) ?? 0) + 1;
        buckets.set(bucket, count);
        return count;
      },
      read: async () => 0,
    },
  };
  const app = createApp({
    ...deps,
    auth,
    profileLinks: createStubProfileLinkDeps(),
    documents: createStubDocumentDeps(),
    profiles: createStubProfileDeps(),
    familyAdmin: createFakeFamilyAdminRepository().repository,
    aiBudget: createStubAiBudgetDeps(),
    healthProbes: { db: async () => {}, storage: async () => {} },
  });
  const request = (body: unknown = { token: 'A'.repeat(43) }, headers = {}) =>
    app.request('/api/invitations/inspect', {
      method: 'POST',
      headers: { origin: 'http://localhost:5173', 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
  return {
    request,
    verify,
    auth,
    advanceHour: () => {
      now += 3_600_000;
    },
  };
}

describe('SPEC-065: route inspect công khai', () => {
  it('SPEC-065: không cần phiên, không lộ định danh và không cache', async () => {
    const { request } = fixture();
    const response = await request();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ kind: 'join_family', role: 'member' });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('SPEC-065: lời mời không hợp lệ trả 404 tối thiểu', async () => {
    const { request, verify } = fixture();
    verify.mockResolvedValue(null);
    const response = await request();
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_NOT_FOUND' } });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it.each([{}, { token: 'abcdef123456' }, { token: 'A'.repeat(43), id: 'bí mật' }])(
    'SPEC-065: body sai trả 422 %j',
    async (body) => {
      const { request, verify } = fixture();
      const response = await request(body);
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(verify).not.toHaveBeenCalled();
    },
  );
  it.each([{ origin: 'https://evil.test' }, { 'content-type': 'text/plain' }, { origin: '' }])(
    'SPEC-065: chặn nguồn hoặc kiểu body sai %j',
    async (headers) => {
      const { request, verify } = fixture();
      const response = await request({}, headers);
      expect(response.status).toBe(403);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(verify).not.toHaveBeenCalled();
    },
  );
  it('SPEC-065: lỗi kho không làm lộ token qua response hoặc logger', async () => {
    const { request, verify, auth } = fixture();
    const log = vi.spyOn(auth.logger, 'error');
    const token = 'A'.repeat(43);
    verify.mockRejectedValue(new Error(`Lỗi tra cứu ${token}`));
    const response = await request({ token });
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain(token);
    expect(JSON.stringify(log.mock.calls)).not.toContain(token);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('SPEC-065: giới hạn riêng theo IP, hết cửa sổ một giờ thì gọi lại được', async () => {
    const { request, advanceHour } = fixture();
    for (let i = 0; i < 30; i++) expect((await request()).status).toBe(200);
    const response = await request();
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_RATE_LIMITED' } });
    expect(response.headers.get('retry-after')).toBe('3600');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect((await request(undefined, { 'x-test-ip': 'ip-2' })).status).toBe(200);
    advanceHour();
    expect((await request()).status).toBe(200);
  });
});
