import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { rateLimitPolicies } from '../domain/rateLimitPolicies.js';
import { rateLimitByIp } from './rateLimitByIp.js';

describe('Phản hồi chặn không đặt cookie', () => {
  it.each([false, true])('loại cookie đã được middleware trước đặt, store lỗi = %s', async (fails) => {
    const app = new Hono();
    app.use('*', async (c, next) => {
      c.header('Set-Cookie', 'old-session=refreshed');
      await next();
    });
    app.use(
      '*',
      rateLimitByIp(
        {
          store: {
            increment: async () => {
              if (fails) throw new Error('db');
              return 6;
            },
            read: async () => 0,
          },
          keyHasher: () => 'hash',
          now: () => 0,
        },
        rateLimitPolicies.register,
        () => 'ip',
      ),
    );
    app.post('/', (c) => c.text('Không được gọi'));
    const response = await app.request('/', { method: 'POST' });
    expect(response.status).toBe(fails ? 503 : 429);
    expect(response.headers.get('set-cookie')).toBeNull();
  });
});
