import { OpenAPIHono } from '@hono/zod-openapi';
import { afterEach, expect, it, vi } from 'vitest';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { registerHealthRoute } from './registerHealthRoute.js';

afterEach(() => vi.useRealTimers());

it('gộp request health đồng thời và chỉ dùng kết quả trong 250 ms', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  let calls = 0;
  let finish!: () => void;
  const probe = () => {
    calls++;
    return new Promise<void>((resolve) => {
      finish = resolve;
    });
  };
  const app = new OpenAPIHono<AppEnv>();
  registerHealthRoute(app, { db: probe, storage: async () => {} });
  const requests = Array.from({ length: 5 }, () => app.request('/api/health'));
  await Promise.resolve();
  expect(calls).toBe(1);
  finish();
  expect((await Promise.all(requests)).map((r) => r.status)).toEqual([200, 200, 200, 200, 200]);
  expect((await app.request('/api/health')).status).toBe(200);
  expect(calls).toBe(1);
  vi.setSystemTime(Date.now() + 251);
  const next = app.request('/api/health');
  await Promise.resolve();
  expect(calls).toBe(2);
  finish();
  expect((await next).status).toBe(200);
});
