import { Hono } from 'hono';
import { expect, it, vi } from 'vitest';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { LegalRepository } from '@src/features/legal/application/ports.js';
import { requireLegalAcceptance } from '@src/features/legal/presentation/requireLegalAcceptance.js';

it.each([
  ['POST', '/api/me/data-exports'],
  ['GET', '/api/me/data-exports/00000000-0000-4000-8000-000000000001'],
  ['GET', '/api/me/data-exports/00000000-0000-4000-8000-000000000001/file'],
])('TC-823 %s %s không chặn vì văn bản pháp lý mới', async (method, path) => {
  const status = vi.fn(async () => ({ accepted: false, missingDocuments: true }));
  const app = new Hono<AppEnv>();
  app.use('*', async (c, next) => {
    c.set('session', { account: { id: 'account' } } as AppEnv['Variables']['session']);
    await next();
  });
  app.use('*', requireLegalAcceptance({ status } as unknown as LegalRepository, { warn: vi.fn() }));
  app.all('*', (c) => c.text('ok'));
  expect((await app.request(path, { method })).status).toBe(200);
  expect(status).not.toHaveBeenCalled();
});
