import type { AccountDeletionStoreResult } from '../application/deletionPorts.js';
import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it, vi } from 'vitest';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';
import type { SessionContext } from '@src/shared/auth/domain/SessionContext.js';
import { requireSession } from '@src/shared/auth/presentation/requireSession.js';
import { registerAccountDeletionRoute } from './registerAccountDeletionRoute.js';

function fixture(authenticated = true) {
  const deps = {
    passwords: {
      findCredential: vi.fn(async () => ({
        usernameNormalized: 'me.lan',
        passwordHash: 'hash',
        credentialVersion: 1,
      })),
    },
    hasher: { hash: vi.fn(async () => 'hash'), verify: vi.fn(async () => true), needsRehash: () => false },
    rateLimit: {
      store: { read: vi.fn(async () => 0), increment: vi.fn(async () => 1) },
      keyHasher: () => 'key',
      now: () => 0,
    },
    store: {
      deleteAccount: vi.fn(async (): Promise<AccountDeletionStoreResult> => ({
        ok: true,
        familyId: null,
        deletedProfileId: null,
      })),
    },
    hashUsername: () => 'hash',
    storage: { deletePrefix: vi.fn(async () => 0) },
    logger: { warn: vi.fn() },
    clientIp: () => 'ip',
    appBaseUrl: 'https://angia.example',
    cookies: { secret: 'secret', secure: false },
  };
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: (r, c) => (r.success ? undefined : errorResponse(c, 'ERR_VALIDATION')),
  });
  app.use('*', async (c, next) => {
    if (authenticated)
      c.set('session', {
        account: { id: 'account' },
        sessionId: 'session',
        csrfToken: 'csrf',
        passwordChangeRequired: false,
      } as SessionContext);
    await next();
  });
  app.use('*', requireSession());
  registerAccountDeletionRoute(app, deps);
  const request = (
    body: object = { password: 'password' },
    origin: string | null = deps.appBaseUrl,
    csrf = 'csrf',
  ) =>
    app.request('/api/me/account-deletion', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-csrf-token': csrf, ...(origin ? { origin } : {}) },
      body: JSON.stringify(body),
    });
  return { deps, request };
}

describe('SPEC-073: HTTP xoá tài khoản', () => {
  it('TC-827: thiếu phiên trả 401 trước đọc credential', async () => {
    const { request, deps } = fixture(false);
    expect((await request()).status).toBe(401);
    expect(deps.passwords.findCredential).not.toHaveBeenCalled();
  });
  it('TC-827: trả 204, xoá cookie phiên và thiết bị Push, không lưu cache', async () => {
    const response = await fixture().request();
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('set-cookie')).toContain('angia_session=;');
    expect(response.headers.get('set-cookie')).toContain('angia_push_device=;');
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  });
  it.each([
    {},
    { password: '' },
    { password: 'x'.repeat(1025) },
    { password: 'password', accountId: 'other' },
  ])('TC-827: DTO sai trả 422 trước đọc credential: %j', async (body) => {
    const { request, deps } = fixture();
    expect((await request(body)).status).toBe(422);
    expect(deps.passwords.findCredential).not.toHaveBeenCalled();
  });
  it.each([null, 'https://evil.example'])('TC-827: Origin không tin cậy bị chặn: %s', async (origin) => {
    const { request, deps } = fixture();
    expect((await request(undefined, origin)).status).toBe(403);
    expect(deps.passwords.findCredential).not.toHaveBeenCalled();
  });
  it('TC-827: CSRF sai bị chặn', async () => {
    expect((await fixture().request(undefined, undefined, 'wrong')).status).toBe(403);
  });
  it.each(['ERR_OWNER_MUST_TRANSFER', 'ERR_OWNER_MUST_DELETE_FAMILY', 'ERR_LAST_GUARDIAN'] as const)(
    'TC-829: %s trả 409 và giữ details',
    async (code) => {
      const { request, deps } = fixture();
      deps.store.deleteAccount.mockResolvedValue({ ok: false, code, details: { profileIds: ['profile'] } });
      const response = await request();
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ error: { code, details: { profileIds: ['profile'] } } });
    },
  );
  it('TC-827: thiếu lựa chọn hồ sơ trả 422', async () => {
    const { request, deps } = fixture();
    deps.store.deleteAccount.mockResolvedValue({ ok: false, code: 'ERR_VALIDATION' });
    expect((await request()).status).toBe(422);
  });
  it('TC-830: sai mật khẩu trả 401', async () => {
    const { request, deps } = fixture();
    deps.hasher.verify.mockResolvedValue(false);
    expect((await request()).status).toBe(401);
  });
  it('TC-830: limiter trả 429 và Retry-After', async () => {
    const { request, deps } = fixture();
    deps.rateLimit.store.read.mockResolvedValue(10);
    const response = await request();
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('900');
  });
  it('TC-830: hạ tầng lỗi trả 503 và chỉ log tên lỗi', async () => {
    const { request, deps } = fixture();
    deps.hasher.verify.mockRejectedValue(new Error('bí mật'));
    expect((await request()).status).toBe(503);
    expect(deps.logger.warn).toHaveBeenCalledWith({ reason: 'Error' }, 'Xoá tài khoản tạm gián đoạn');
  });
});
