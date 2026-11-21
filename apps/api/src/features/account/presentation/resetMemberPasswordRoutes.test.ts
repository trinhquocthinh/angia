import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it, vi } from 'vitest';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { SessionContext } from '@src/shared/auth/domain/SessionContext.js';
import { requireSession } from '@src/shared/auth/presentation/requireSession.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';
import { createStubAccountDeps } from '@src/shared/test/createStubAccountDeps.js';
import { TEST_COOKIE_SECRET } from '@src/shared/test/seedAuthFixtures.js';
import { registerAccountRoutes } from './registerAccountRoutes.js';

const target = '00000000-0000-4000-8000-000000000002';
function fixture(authenticated = true) {
  const deps = {
    ...createStubAccountDeps(),
    memberPasswordResets: {
      authorize: vi.fn(async () => ({ ok: true as const, usernameNormalized: 'me.lan' })),
      reset: vi.fn(async () => ({ ok: true as const })),
    },
    hasher: { hash: vi.fn(async () => 'secret-hash'), verify: vi.fn(), needsRehash: () => false },
    logger: { warn: vi.fn() },
  };
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: (r, c) => (r.success ? undefined : errorResponse(c, 'ERR_VALIDATION')),
  });
  app.use('*', async (c, next) => {
    if (authenticated)
      c.set('session', {
        account: { id: 'actor' },
        family: { id: 'family' },
        role: 'main',
        csrfToken: 'csrf',
        passwordChangeRequired: false,
      } as SessionContext);
    await next();
  });
  app.use('*', requireSession());
  registerAccountRoutes(app, { ...deps, cookies: { secret: TEST_COOKIE_SECRET, secure: false } });
  const request = (id = target, csrf = 'csrf') =>
    app.request(`/api/family/members/${id}/password-reset`, {
      method: 'POST',
      headers: { 'x-csrf-token': csrf },
    });
  return { request, deps };
}
describe('HTTP đặt lại mật khẩu thành viên', () => {
  it('TC-756: trả mật khẩu một lần và hạn dùng, không lộ hash/cookie', async () => {
    const { request } = fixture();
    const response = await request();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(await response.json()).toEqual({
      temporaryPassword: expect.any(String),
      expiresAt: expect.any(String),
    });
  });
  it('hash lỗi trả 503, log chỉ có tên lớp lỗi và không ghi reset', async () => {
    const { request, deps } = fixture();
    deps.hasher.hash.mockRejectedValue(new Error('bí mật'));
    const response = await request();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_AUTH_UNAVAILABLE' } });
    expect(deps.memberPasswordResets.reset).not.toHaveBeenCalled();
    expect(deps.logger.warn).toHaveBeenCalledExactlyOnceWith(
      { reason: 'Error' },
      'Đặt lại mật khẩu tạm gián đoạn',
    );
  });
  it('UUID sai trả ERR_VALIDATION trước đọc dữ liệu', async () => {
    const { request, deps } = fixture();
    const response = await request('not-a-uuid');
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    expect(deps.memberPasswordResets.authorize).not.toHaveBeenCalled();
  });
  it('thiếu phiên trả 401', async () => {
    expect((await fixture(false).request()).status).toBe(401);
  });
  it('CSRF sai bị chặn trước đọc và hash', async () => {
    const { request, deps } = fixture();
    expect((await request(target, 'wrong')).status).toBe(403);
    expect(deps.memberPasswordResets.authorize).not.toHaveBeenCalled();
    expect(deps.hasher.hash).not.toHaveBeenCalled();
  });
});
