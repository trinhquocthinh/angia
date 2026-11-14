import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it, vi } from 'vitest';
import type { VerifiedIdentity } from '@src/shared/identity/application/ports.js';
import type { LocalLoginSessions } from '../application/ports.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';
import { createStubAccountDeps } from '@src/shared/test/createStubAccountDeps.js';
import { TEST_COOKIE_SECRET } from '@src/shared/test/seedAuthFixtures.js';
import { registerAccountRoutes } from './registerAccountRoutes.js';

function fixture() {
  const deps = {
    ...createStubAccountDeps(),
    identity: {
      verifyPassword: vi.fn(async (): Promise<VerifiedIdentity | null> => ({
        accountId: 'account',
        credentialVersion: 1,
        lockedAt: null,
        mustChangePassword: false,
        tempPasswordExpiresAt: null,
      })),
    },
    localLoginSessions: {
      createIfCurrent: vi.fn<LocalLoginSessions['createIfCurrent']>(async () => ({
        ok: true,
        sessionId: 'session',
      })),
    },
    logger: { warn: vi.fn() },
  };
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: (r, c) => (r.success ? undefined : errorResponse(c, 'ERR_VALIDATION')),
  });
  registerAccountRoutes(app, { ...deps, cookies: { secret: TEST_COOKIE_SECRET, secure: false } });
  const request = (
    body: unknown = { username: 'me.lan', password: 'password' },
    origin = 'https://angia.test',
    contentType = 'application/json',
  ) =>
    app.request('/api/auth/password-login', {
      method: 'POST',
      headers: { origin, 'content-type': contentType },
      body: JSON.stringify(body),
    });
  return { deps, request };
}
describe('HTTP đăng nhập local', () => {
  it('trả DTO phiên và cookie, không lộ sessionId', async () => {
    const { request } = fixture();
    const response = await request();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      session: {
        csrfToken: expect.any(String),
        expiresAt: expect.any(String),
        passwordChangeRequired: false,
      },
    });
    expect(response.headers.get('set-cookie')).toContain('HttpOnly; SameSite=Lax');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it.each([
    ['', 'application/json'],
    ['https://evil.test', 'application/json'],
    ['https://angia.test/', 'application/json'],
    ['https://angia.test', 'text/plain'],
  ])('Origin/JSON sai chặn trước limiter: %s %s', async (origin, type) => {
    const { deps, request } = fixture();
    const read = vi.spyOn(deps.rateLimit.store, 'read');
    const response = await request({}, origin, type);
    expect(response.status).toBe(403);
    expect(read).not.toHaveBeenCalled();
    expect(deps.identity.verifyPassword).not.toHaveBeenCalled();
  });
  it.each([
    {},
    { username: '', password: 'x' },
    { username: 'x', password: '' },
    { username: 'x'.repeat(33), password: 'x' },
    { username: 'x', password: 'x'.repeat(1025) },
  ])('body sai trả 422: %j', async (body) => {
    const { deps, request } = fixture();
    expect((await request(body)).status).toBe(422);
    expect(deps.identity.verifyPassword).not.toHaveBeenCalled();
  });
  it('TC-907: lỗi hash trả 503 và không cookie/phiên', async () => {
    const { deps, request } = fixture();
    deps.identity.verifyPassword.mockRejectedValue(new Error('hash'));
    const response = await request();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_AUTH_UNAVAILABLE' } });
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(deps.localLoginSessions.createIfCurrent).not.toHaveBeenCalled();
    // Log chỉ mang tên lớp lỗi, không username/thông điệp hạ tầng.
    expect(deps.logger.warn).toHaveBeenCalledWith({ reason: 'Error' }, 'Đăng nhập local tạm gián đoạn');
  });
  it('limiter chặn trước hash, có Retry-After nguyên và không cookie', async () => {
    const { deps, request } = fixture();
    vi.spyOn(deps.rateLimit.store, 'read').mockResolvedValue(10);
    const response = await request();
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_RATE_LIMITED' } });
    expect(response.headers.get('retry-after')).toMatch(/^[1-9][0-9]*$/);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(deps.identity.verifyPassword).not.toHaveBeenCalled();
  });
  it('credential sai trả thông điệp chuẩn và không cookie', async () => {
    const { deps, request } = fixture();
    deps.identity.verifyPassword.mockResolvedValue(null);
    const response = await request();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: {
        code: 'ERR_INVALID_CREDENTIALS',
        message: 'Tên đăng nhập hoặc mật khẩu chưa đúng.',
      },
    });
    expect(response.headers.get('set-cookie')).toBeNull();
  });
  it.each(['gone', 'locked', 'stale'] as const)(
    'recheck %s trả đúng HTTP và không cookie',
    async (reason) => {
      const { deps, request } = fixture();
      deps.localLoginSessions.createIfCurrent.mockResolvedValue({ ok: false, reason });
      const response = await request();
      expect(response.status).toBe(reason === 'locked' ? 403 : 401);
      expect(await response.json()).toMatchObject({
        error: {
          code: reason === 'locked' ? 'ERR_ACCOUNT_LOCKED' : 'ERR_INVALID_CREDENTIALS',
        },
      });
      expect(response.headers.get('set-cookie')).toBeNull();
    },
  );
  it('trả cờ hạn chế cho credential bắt đổi mật khẩu', async () => {
    const { deps, request } = fixture();
    deps.identity.verifyPassword.mockResolvedValue({
      accountId: 'account',
      credentialVersion: 1,
      lockedAt: null,
      mustChangePassword: true,
      tempPasswordExpiresAt: null,
    });
    expect(await (await request()).json()).toMatchObject({ session: { passwordChangeRequired: true } });
  });
});
