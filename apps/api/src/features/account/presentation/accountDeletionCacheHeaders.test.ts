import { createMiddleware } from 'hono/factory';
import { expect, it, vi } from 'vitest';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { createStubApp } from '@src/shared/test/createStubApp.js';

vi.mock('@src/shared/auth/presentation/loadSession.js', () => ({
  loadSession: () =>
    createMiddleware<AppEnv>(async (c, next) => {
      c.set(
        'session',
        c.req.header('x-test-session')
          ? ({
              account: { id: 'account' },
              csrfToken: 'expected',
            } as AppEnv['Variables']['session'])
          : null,
      );
      await next();
    }),
}));

it.each([
  [false, 401],
  [true, 403],
] as const)('TC-827: phản hồi chặn xác thực có phiên=%s vẫn không lưu cache', async (hasSession, status) => {
  const response = await createStubApp().request('/api/me/account-deletion', {
    method: 'POST',
    headers: hasSession ? { 'x-test-session': 'yes', 'x-csrf-token': 'wrong' } : {},
  });
  expect(response.status).toBe(status);
  expect(response.headers.get('cache-control')).toBe('no-store');
});
