import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it, vi } from 'vitest';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { SessionContext } from '@src/shared/auth/domain/SessionContext.js';
import { createStubReviewDeps } from '@src/shared/test/createStubReviewDeps.js';
import { registerHouseholdInvitationRoutes } from './registerHouseholdInvitationRoutes.js';
import { registerInvitationAcceptanceRoutes } from './registerInvitationAcceptanceRoutes.js';

function fixture() {
  const buckets = new Map<string, number>();
  const increment = vi.fn(async (key: string, start: number) => {
    const bucket = `${key}:${start}`;
    const count = (buckets.get(bucket) ?? 0) + 1;
    buckets.set(bucket, count);
    return count;
  });
  const read = vi.fn(async (key: string, start: number) => buckets.get(`${key}:${start}`) ?? 0);
  const rateLimit = {
    now: () => 1,
    keyHasher: (kind: string, key: unknown) => `${kind}:${String(key)}`,
    store: { increment, read },
  };
  const stub = createStubReviewDeps();
  const value = {
    invitationId: '00000000-0000-4000-8000-000000000001',
    token: 'A'.repeat(43),
    code: 'ABCDEFGH',
    expiresAt: new Date(),
  };
  const create = vi.fn(async () => ({ ok: true as const, value }));
  const replace = vi.fn(async () => ({ ok: true as const, value }));
  const accept = vi.fn(async () => ({ ok: false as const, code: 'ERR_NOT_FOUND' as const }));
  const app = new OpenAPIHono<AppEnv>();
  app.use('*', async (c, next) => {
    c.set('session', {
      account: { id: 'account' },
      family: c.req.header('x-family') === 'none' ? null : { id: c.req.header('x-family') ?? 'family-a' },
      role: c.req.header('x-role') ?? 'main',
    } as SessionContext);
    await next();
  });
  registerHouseholdInvitationRoutes(app, {
    ...stub.householdInvitations,
    rateLimit,
    repository: { ...stub.householdInvitations.repository, create, replace },
  });
  registerInvitationAcceptanceRoutes(app, {
    ...stub.invitationAcceptance,
    rateLimit,
    clientIp: (c) => c.req.header('x-ip') ?? 'ip-a',
    acceptance: { accept },
  });
  const request = (path = '/api/family/invitations', headers = {}, token = 'A'.repeat(43)) =>
    app.request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(
        path.includes('/accept')
          ? { token }
          : path.includes('/replace')
            ? {}
            : { kind: 'join_family', role: 'member' },
      ),
    });
  return { app, request, create, replace, accept, increment, read };
}

async function expectLimited(response: Response) {
  expect(response.status).toBe(429);
  expect(await response.json()).toEqual({
    error: { code: 'ERR_RATE_LIMITED', message: 'Bạn thao tác hơi nhanh. Vui lòng thử lại sau ít giây.' },
  });
  const retry = Number(response.headers.get('retry-after'));
  expect(Number.isInteger(retry) && retry >= 1).toBe(true);
}

describe('SPEC-078: giới hạn lời mời', () => {
  it('TC-848: tạo lại cùng lời mời và thay mã dùng chung 20 lượt mỗi nhà', async () => {
    const f = fixture();
    for (let i = 0; i < 19; i++) expect((await f.request()).status).toBe(201);
    const path = '/api/family/invitations/00000000-0000-4000-8000-000000000001/replace';
    expect((await f.request(path)).status).toBe(201);
    await expectLimited(await f.request());
    await expectLimited(await f.request(path));
    expect(f.create).toHaveBeenCalledTimes(19);
    expect(f.replace).toHaveBeenCalledTimes(1);
    expect((await f.request(undefined, { 'x-family': 'family-b' })).status).toBe(201);
    expect((await f.request(undefined, { 'x-family': 'none' })).status).toBe(403);
    expect((await f.request(undefined, { 'x-role': 'member' })).status).toBe(403);
  });
  it('TC-849: 20 mã sai chặn trước repository kể cả mã hợp lệ, IP khác độc lập', async () => {
    const f = fixture();
    const path = '/api/invitations/accept';
    for (let i = 0; i < 20; i++) expect((await f.request(path)).status).toBe(404);
    await expectLimited(await f.request(path, {}, 'VALID123'));
    expect(f.accept).toHaveBeenCalledTimes(20);
    expect((await f.request(path, { 'x-ip': 'ip-b' })).status).toBe(404);
  });
  it.each(['ERR_FORBIDDEN', 'ERR_ACCOUNT_ALREADY_IN_FAMILY', 'ERR_DELETION_PENDING'])(
    'TC-851: lỗi %s không tính là mã sai',
    async (code) => {
      const f = fixture();
      f.accept.mockResolvedValue({ ok: false, code } as never);
      for (let i = 0; i < 21; i++) await f.request('/api/invitations/accept');
      expect(f.accept).toHaveBeenCalledTimes(21);
      expect(f.increment).not.toHaveBeenCalled();
    },
  );
  it('TC-851: mã hợp lệ dưới ngưỡng không tăng bộ đếm', async () => {
    const f = fixture();
    f.accept.mockResolvedValue({ ok: true, familyId: 'family' } as never);
    for (let i = 0; i < 21; i++) expect((await f.request('/api/invitations/accept')).status).toBe(204);
    expect(f.increment).not.toHaveBeenCalled();
  });
  it('TC-851: lỗi kho quota tạo lời mời chặn trước repository', async () => {
    const f = fixture();
    f.increment.mockRejectedValue(new Error('Kho tạm ngừng'));
    const response = await f.request();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_AUTH_UNAVAILABLE' } });
    expect(f.create).not.toHaveBeenCalled();
  });
  it('TC-851: lỗi đọc quota nhận lời mời chặn trước repository', async () => {
    const f = fixture();
    f.read.mockRejectedValue(new Error('Kho tạm ngừng'));
    expect((await f.request('/api/invitations/accept')).status).toBe(503);
    expect(f.accept).not.toHaveBeenCalled();
  });
  it('TC-851: lỗi ghi mã sai không bỏ qua kho quota', async () => {
    const f = fixture();
    f.increment.mockRejectedValue(new Error('Kho tạm ngừng'));
    expect((await f.request('/api/invitations/accept')).status).toBe(503);
    expect(f.accept).toHaveBeenCalledTimes(1);
  });
  it('TC-848: body sai vẫn tiêu quota sau khi phiên và quyền đã hợp lệ', async () => {
    const f = fixture();
    for (const body of ['{}', '{']) {
      const response = await f.app.request('/api/family/invitations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      });
      expect([400, 422]).toContain(response.status);
    }
    expect(f.increment).toHaveBeenCalledTimes(2);
    expect(f.create).not.toHaveBeenCalled();
  });
});
