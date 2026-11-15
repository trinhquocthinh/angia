import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { requirePasswordChanged } from './requirePasswordChanged.js';

describe('Guard phiên hạn chế', () => {
  it.each([
    ['GET', '/api/me', true, 403],
    ['GET', '/api/reminders', true, 403],
    ['POST', '/api/me/password', true, 204],
    ['POST', '/api/auth/logout', true, 204],
    ['GET', '/api/me/password', true, 403],
    ['GET', '/api/auth/logout', true, 403],
    ['POST', '/api/me/password/extra', true, 403],
    ['GET', '/api/me', false, 204],
  ] as const)('%s %s với hạn chế=%s trả %i', async (method, path, restricted, status) => {
    const app = new Hono<AppEnv>();
    app.use('*', async (c, next) => {
      c.set('session', { passwordChangeRequired: restricted } as NonNullable<AppEnv['Variables']['session']>);
      await next();
    });
    app.use('*', requirePasswordChanged());
    app.all('*', (c) => c.body(null, 204));
    const response = await app.request(path, { method });
    expect(response.status).toBe(status);
    if (status === 403)
      expect(await response.json()).toMatchObject({
        error: {
          code: 'ERR_PASSWORD_CHANGE_REQUIRED',
          message: 'Bạn cần đặt mật khẩu mới trước khi tiếp tục.',
        },
      });
  });
});
