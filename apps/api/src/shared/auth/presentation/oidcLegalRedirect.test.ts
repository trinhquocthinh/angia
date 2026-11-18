import { OpenAPIHono } from '@hono/zod-openapi';
import { expect, it, vi } from 'vitest';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { createStubAuthDeps } from '@src/shared/test/createStubAuthDeps.js';
import { registerAuthRoutes } from './registerAuthRoutes.js';
import { writePendingLogin } from './pendingLoginCookie.js';

async function callback(status: { accepted: boolean; missingDocuments: boolean } | Error) {
  const deps = createStubAuthDeps();
  deps.login.oidc.exchangeCode = vi.fn().mockResolvedValue({ subject: 'sub', groups: [] });
  deps.login.accounts.upsertFromIdentity = vi.fn().mockResolvedValue({ id: 'account' });
  deps.login.sessions.create = vi.fn().mockResolvedValue({ id: 'session' });
  deps.login.sessions.findActive = vi.fn().mockResolvedValue({ account: { id: 'account' } });
  const legal = {
    status: status instanceof Error ? vi.fn().mockRejectedValue(status) : vi.fn().mockResolvedValue(status),
  };
  const app = new OpenAPIHono<AppEnv>();
  registerAuthRoutes(app, deps, legal);
  app.get('/pending', async (c) => {
    await writePendingLogin(
      c,
      { state: 's', codeVerifier: 'c', nonce: 'n' },
      { secret: deps.cookieSecret, secure: false },
    );
    return c.text('');
  });
  const pending = await app.request('/pending');
  const response = await app.request('/api/auth/callback?code=c&state=s', {
    headers: { cookie: pending.headers.getSetCookie()[0]!.split(';')[0]! },
  });
  return { response, legal };
}

it.each([
  [false, false, '/account/legal-update'],
  [true, true, '/account/legal-update'],
  [true, false, '/'],
])(
  'TC-752/767: OIDC accepted=%s missing=%s tới %s trước khi tạo nhà',
  async (accepted, missingDocuments, to) => {
    const { response, legal } = await callback({ accepted, missingDocuments });
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(to);
    expect(legal.status).toHaveBeenCalledWith('account');
    expect(response.headers.getSetCookie().join(';')).toContain('angia_session=');
  },
);

it('TC-752: lỗi đọc trạng thái pháp lý không cho đi tiếp hoặc phát cookie phiên mới', async () => {
  const { response } = await callback(new Error('unavailable'));
  expect(response.headers.get('location')).toBe('/login?error=auth');
  expect(response.headers.getSetCookie().join(';')).not.toContain('angia_session=');
});
