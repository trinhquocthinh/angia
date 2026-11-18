import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it, vi } from 'vitest';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { createStubAuthDeps } from '@src/shared/test/createStubAuthDeps.js';
import { registerAuthRoutes } from './registerAuthRoutes.js';
import { takePendingLogin, writePendingLogin } from './pendingLoginCookie.js';

describe('Reauth OIDC và cookie PKCE', () => {
  it.each([
    ['?reauth=1', { reauth: true }],
    ['', undefined],
    ['?reauth=0', undefined],
  ])('TC-900: login %s truyền đúng lựa chọn reauth', async (query, options) => {
    const deps = createStubAuthDeps();
    deps.login.oidc.createAuthorizationRequest = vi.fn(async () => ({
      url: new URL('https://issuer.test/authorize'),
      pending: { state: 's', codeVerifier: 'c', nonce: 'n' },
    }));
    const app = new OpenAPIHono<AppEnv>();
    registerAuthRoutes(app, deps, { status: vi.fn() });
    expect((await app.request('/api/auth/login' + query)).status).toBe(302);
    if (options) expect(deps.login.oidc.createAuthorizationRequest).toHaveBeenCalledWith(options);
    else expect(deps.login.oidc.createAuthorizationRequest).toHaveBeenCalledWith();
  });
  it.each([undefined, 0] as const)('TC-900: cookie cũ và reauth giữ maxAge %s qua chữ ký', async (maxAge) => {
    const app = new OpenAPIHono<AppEnv>();
    const settings = { secret: 's'.repeat(32), secure: false };
    const pending = { state: 's', codeVerifier: 'c', nonce: 'n', ...(maxAge === 0 ? { maxAge } : {}) };
    app.get('/write', async (c) => {
      await writePendingLogin(c, pending, settings);
      return c.text('');
    });
    app.get('/read', async (c) => c.json(await takePendingLogin(c, settings)));
    const first = await app.request('/write');
    const read = await app.request('/read', {
      headers: { cookie: first.headers.get('set-cookie')!.split(';')[0]! },
    });
    expect(await read.json()).toEqual(pending);
    expect(read.headers.get('set-cookie')).toContain('Max-Age=0');
  });
  it('TC-901: callback reauth thiếu authTime chuyển về lỗi đăng nhập', async () => {
    const deps = createStubAuthDeps();
    deps.login.oidc.exchangeCode = vi.fn(async () => ({ subject: 'sub', groups: [] }));
    deps.login.accounts.upsertFromIdentity = vi.fn(async () => ({ id: 'account' }));
    deps.login.sessions.create = vi.fn(async () => ({ id: 'session' }));
    const app = new OpenAPIHono<AppEnv>();
    registerAuthRoutes(app, deps, { status: vi.fn() });
    app.get('/pending', async (c) => {
      await writePendingLogin(
        c,
        { state: 's', codeVerifier: 'c', nonce: 'n', maxAge: 0 },
        { secret: deps.cookieSecret, secure: false },
      );
      return c.text('');
    });
    const pending = await app.request('/pending');
    const response = await app.request('/api/auth/callback?code=c&state=s', {
      headers: { cookie: pending.headers.get('set-cookie')!.split(';')[0]! },
    });
    expect(response.headers.get('location')).toBe('/login?error=auth');
    expect(deps.login.accounts.upsertFromIdentity).not.toHaveBeenCalled();
    expect(deps.login.sessions.create).not.toHaveBeenCalled();
  });
});
