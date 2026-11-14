import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it, vi } from 'vitest';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { SessionContext } from '@src/shared/auth/domain/SessionContext.js';
import { requireSession } from '@src/shared/auth/presentation/requireSession.js';
import { requirePasswordChanged } from '@src/shared/auth/presentation/requirePasswordChanged.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';
import { registerChangePasswordRoute } from './registerChangePasswordRoute.js';

function fixture() {
  const deps = {
    passwords: {
      findCredential: vi.fn(async () => ({
        usernameNormalized: 'me.lan',
        passwordHash: 'old-hash',
        credentialVersion: 1,
      })),
      replaceIfCurrent: vi.fn(async () => ({ ok: true as const })),
    },
    hasher: {
      hash: vi.fn(async () => 'new-hash'),
      verify: vi.fn(async () => true),
      needsRehash: () => false,
    },
    rateLimit: {
      store: { read: vi.fn(async () => 0), increment: vi.fn(async () => 1) },
      keyHasher: () => 'key',
      now: () => 0,
    },
    now: () => new Date(0),
    clientIp: () => 'ip',
    logger: { warn: vi.fn() },
  };
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: (r, c) => (r.success ? undefined : errorResponse(c, 'ERR_VALIDATION')),
  });
  app.use('*', async (c, next) => {
    c.set('session', {
      account: { id: 'account' },
      sessionId: 'session',
      csrfToken: 'csrf',
      passwordChangeRequired: false,
    } as SessionContext);
    await next();
  });
  app.use('*', requireSession(), requirePasswordChanged());
  registerChangePasswordRoute(app, deps);
  const request = (
    body: object = { currentPassword: 'old-password', newPassword: 'new-password' },
    csrf = 'csrf',
  ) =>
    app.request('/api/me/password', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-csrf-token': csrf },
      body: JSON.stringify(body),
    });
  return { deps, request };
}
describe('HTTP đổi mật khẩu', () => {
  it('trả 204 không body/cookie và no-store', async () => {
    const { request } = fixture();
    const response = await request();
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('CSRF sai chặn trước đọc credential', async () => {
    const { request, deps } = fixture();
    expect((await request({}, 'wrong')).status).toBe(403);
    expect(deps.passwords.findCredential).not.toHaveBeenCalled();
  });
  it.each([
    {},
    { newPassword: '' },
    { currentPassword: '', newPassword: 'valid-password' },
    { newPassword: 'x'.repeat(1025) },
  ])('body sai trả 422 trước đọc credential: %j', async (body) => {
    const { request, deps } = fixture();
    expect((await request(body)).status).toBe(422);
    expect(deps.passwords.findCredential).not.toHaveBeenCalled();
  });
  it('thiếu mật khẩu cũ trả lỗi trường currentPassword', async () => {
    const { request } = fixture();
    const response = await request({ newPassword: 'new-password' });
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      error: { code: 'ERR_VALIDATION', details: { field: 'currentPassword' } },
    });
  });
  it('limiter chặn trả Retry-After', async () => {
    const { request, deps } = fixture();
    deps.rateLimit.store.read.mockResolvedValue(10);
    const response = await request();
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('900');
    expect(deps.hasher.verify).not.toHaveBeenCalled();
  });
  it('hash lỗi trả 503 và chỉ log tên lớp lỗi', async () => {
    const { request, deps } = fixture();
    deps.hasher.hash.mockRejectedValue(new Error('không được log bí mật'));
    const response = await request();
    expect(response.status).toBe(503);
    expect(deps.logger.warn).toHaveBeenCalledExactlyOnceWith(
      { reason: 'Error' },
      'Đổi mật khẩu tạm gián đoạn',
    );
    expect(deps.passwords.replaceIfCurrent).not.toHaveBeenCalled();
  });
});
