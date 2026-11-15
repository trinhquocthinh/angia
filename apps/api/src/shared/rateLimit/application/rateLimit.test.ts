import { describe, expect, it } from 'vitest';
import { consumeRateLimit } from './consumeRateLimit.js';
import { checkRateLimit } from './checkRateLimit.js';
import { recordRateLimitHit } from './recordRateLimitHit.js';
import { rateLimitPolicies } from '../domain/rateLimitPolicies.js';

function fixture() {
  const buckets = new Map<string, number>();
  const deps = {
    store: {
      increment: async (key: string, window: number) => {
        const id = `${key}:${window}`;
        const count = (buckets.get(id) ?? 0) + 1;
        buckets.set(id, count);
        return count;
      },
      read: async (key: string, window: number) => buckets.get(`${key}:${window}`) ?? 0,
    },
    keyHasher: (kind: string, key: string | { ip: string; username: string }) =>
      `${kind}:${JSON.stringify(key)}`,
    now: () => 1,
  };
  return deps;
}
describe('Thao tác giới hạn trước hash', () => {
  it('TC-846: consume tăng mọi lần, chỉ chặn khi vượt ngưỡng', async () => {
    const deps = fixture();
    for (let i = 0; i < 5; i++)
      expect((await consumeRateLimit(deps, rateLimitPolicies.register, 'ip')).blocked).toBe(false);
    expect((await consumeRateLimit(deps, rateLimitPolicies.register, 'ip')).blocked).toBe(true);
  });
  it('TC-845: check chỉ đọc; record tăng; cửa sổ mới độc lập', async () => {
    const deps = fixture();
    const policy = rateLimitPolicies.login_failed;
    const key = { ip: 'ip', username: 'me.lan' };
    for (let i = 0; i < 20; i++) expect((await checkRateLimit(deps, policy, key)).blocked).toBe(false);
    for (let i = 0; i < 10; i++) await recordRateLimitHit(deps, policy, key);
    expect((await checkRateLimit(deps, policy, key)).blocked).toBe(true);
    expect((await checkRateLimit({ ...deps, now: () => 900_000 }, policy, key)).blocked).toBe(false);
  });
  it('lỗi store được truyền cho presentation fail closed', async () => {
    const deps = fixture();
    deps.store.increment = async () => {
      throw new Error('db');
    };
    await expect(consumeRateLimit(deps, rateLimitPolicies.register, 'ip')).rejects.toThrow('db');
  });
});
