import { describe, expect, it, vi } from 'vitest';
import { loginLocalAccount } from './loginLocalAccount.js';

function fixture() {
  const buckets = new Map<string, number>();
  const deps = {
    identity: { verifyPassword: vi.fn(async () => null) },
    localLoginSessions: { createIfCurrent: vi.fn() },
    passwordResetNotices: { findLatestActor: vi.fn() },
    rateLimit: {
      store: {
        read: async (key: string) => buckets.get(key) ?? 0,
        increment: async (key: string) => {
          const count = (buckets.get(key) ?? 0) + 1;
          buckets.set(key, count);
          return count;
        },
      },
      keyHasher: (kind: string, key: unknown) => `${kind}:${JSON.stringify(key)}`,
      now: () => 1,
    },
    generateToken: () => 'csrf',
    now: () => new Date(1),
  };
  const run = (identifier: string, ip = 'ip') =>
    loginLocalAccount(deps, { identifier, ip, password: 'wrong' });
  return { deps, run, buckets };
}

describe('SPEC-078 chống lách đăng nhập', () => {
  it('SPEC-078 chống lách: 30 username khác nhau chặn lần 31 trước hash, IP khác độc lập', async () => {
    const { deps, run } = fixture();
    for (let i = 0; i < 30; i++) {
      expect(await run(`random.${i}`)).toEqual({ ok: false, code: 'ERR_INVALID_CREDENTIALS' });
    }
    expect(await run('random.31')).toEqual({
      ok: false,
      code: 'ERR_RATE_LIMITED',
      retryAfterSeconds: 900,
    });
    expect(deps.identity.verifyPassword).toHaveBeenCalledTimes(30);
    expect(await run('random.31', 'other-ip')).toEqual({ ok: false, code: 'ERR_INVALID_CREDENTIALS' });
  });
  it('TC-851: chín lần sai dưới ngưỡng vẫn được xác thực', async () => {
    const { deps, run } = fixture();
    for (let i = 0; i < 9; i++) {
      expect(await run('same')).toEqual({ ok: false, code: 'ERR_INVALID_CREDENTIALS' });
    }
    expect(deps.identity.verifyPassword).toHaveBeenCalledTimes(9);
  });
  it('SPEC-078 chống lách: kiểm cả hai bucket và lấy thời gian chờ lớn nhất', async () => {
    const { deps, run, buckets } = fixture();
    buckets.set('login_failed:{"ip":"ip","username":"same"}', 10);
    buckets.set('login_failed_ip:"ip"', 30);
    const read = vi.spyOn(deps.rateLimit.store, 'read');
    deps.rateLimit.now = vi.fn().mockReturnValueOnce(500_000).mockReturnValueOnce(100_000);
    expect(await run('same')).toEqual({
      ok: false,
      code: 'ERR_RATE_LIMITED',
      retryAfterSeconds: 800,
    });
    expect(read).toHaveBeenCalledTimes(2);
    expect(deps.identity.verifyPassword).not.toHaveBeenCalled();
  });
});
