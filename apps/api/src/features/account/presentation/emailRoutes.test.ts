import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it, vi } from 'vitest';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { SessionContext } from '@src/shared/auth/domain/SessionContext.js';
import { requireSession } from '@src/shared/auth/presentation/requireSession.js';
import { requirePasswordChanged } from '@src/shared/auth/presentation/requirePasswordChanged.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';
import { createStubAccountDeps } from '@src/shared/test/createStubAccountDeps.js';
import { registerAccountRoutes } from './registerAccountRoutes.js';

function fixture(session = true, restricted = false) {
  const emails = {
    change: vi.fn(async () => ({
      ok: true as const,
      value: {
        email: 'lan@example.com',
        emailVerified: false,
        pendingEmail: null,
      },
    })),
    requestVerification: vi.fn(async () => ({ ok: true as const, sent: true })),
    confirmVerification: vi.fn(async () => ({ ok: true as const })),
  };
  const deps = {
    ...createStubAccountDeps(),
    emails,
    cookies: { secret: 'test', secure: false },
    logger: { warn: vi.fn() },
  };
  deps.passwords.findCredential = async () => ({
    usernameNormalized: 'lan',
    passwordHash: 'hash',
    credentialVersion: 1,
  });
  deps.hasher.verify = async () => true;
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: (r, c) => (r.success ? undefined : errorResponse(c, 'ERR_VALIDATION')),
  });
  app.use('/api/me/*', async (c, next) => {
    if (session)
      c.set('session', {
        account: { id: 'account' },
        sessionId: 'session',
        csrfToken: 'csrf',
        passwordChangeRequired: restricted,
      } as SessionContext);
    await next();
  });
  app.use('/api/me/*', requireSession(), requirePasswordChanged());
  registerAccountRoutes(app, deps);
  const request = (path: string, body?: object, csrf = 'csrf', origin = deps.appBaseUrl) =>
    app.request(path, {
      method: path === '/api/me/email' ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json', 'x-csrf-token': csrf, origin },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  return { request, emails, deps };
}

describe('HTTP xác minh và đổi email', () => {
  it('TC-925: yêu cầu gửi trả 202 và no-store', async () => {
    const response = await fixture().request('/api/me/email-verifications');
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ sent: true });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('TC-932: đổi email trả trạng thái đã chuẩn hoá', async () => {
    const response = await fixture().request('/api/me/email', {
      email: ' LAN@example.com ',
      currentPassword: 'password',
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      email: 'lan@example.com',
      emailVerified: false,
      pendingEmail: null,
    });
  });
  it('TC-925: xác nhận công khai trả 204 không cookie', async () => {
    const response = await fixture(false).request('/api/auth/email-verifications/confirm', {
      token: 'token',
    });
    expect(response.status).toBe(204);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('set-cookie')).toBeNull();
  });
  it('TC-926: xác nhận sai Origin bị chặn trước kho token', async () => {
    const { request, emails } = fixture(false);
    expect(
      (await request('/api/auth/email-verifications/confirm', { token: 'token' }, '', 'https://evil.test'))
        .status,
    ).toBe(403);
    expect(emails.confirmVerification).not.toHaveBeenCalled();
  });
  it.each(['/api/me/email', '/api/me/email-verifications'])('TC-932: %s cần phiên và CSRF', async (path) => {
    expect((await fixture(false).request(path)).status).toBe(401);
    expect((await fixture().request(path, {}, '')).status).toBe(403);
    expect((await fixture(true, true).request(path, {})).status).toBe(403);
  });
});
