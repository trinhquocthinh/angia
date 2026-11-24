import { Hono } from 'hono';
import { expect, it, vi } from 'vitest';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { LegalRepository } from '@src/features/legal/application/ports.js';
import { requireLegalAcceptance } from '@src/features/legal/presentation/requireLegalAcceptance.js';

it('TC-831: xoá tài khoản không bị chặn vì thiếu đồng ý pháp lý', async () => {
  const status = vi.fn(async () => ({ accepted: false, missingDocuments: true }));
  const app = new Hono<AppEnv>();
  app.use('*', async (c, next) => {
    c.set('session', { account: { id: 'account' } } as AppEnv['Variables']['session']);
    await next();
  });
  app.use('*', requireLegalAcceptance({ status } as unknown as LegalRepository, { warn: vi.fn() }));
  app.post('/api/me/account-deletion', (c) => c.body(null, 204));
  expect((await app.request('/api/me/account-deletion', { method: 'POST' })).status).toBe(204);
  expect(status).not.toHaveBeenCalled();
});
