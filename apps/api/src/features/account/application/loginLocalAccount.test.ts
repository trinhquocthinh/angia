import { describe, expect, it, vi } from 'vitest';
import type { VerifiedIdentity } from '@src/shared/identity/application/ports.js';
import { PasswordHashBusyError } from '@src/shared/identity/application/PasswordHashBusyError.js';
import { loginLocalAccount } from './loginLocalAccount.js';

const now = new Date('2026-11-14T00:00:00Z');
const input = { username: 'Me.Lan', password: 'secret', ip: 'ip' };
function fixture() {
  const identity: VerifiedIdentity = {
    accountId: 'account',
    credentialVersion: 1,
    lockedAt: null,
    mustChangePassword: false,
    tempPasswordExpiresAt: null,
  };
  const deps = {
    identity: { verifyPassword: vi.fn(async (): Promise<VerifiedIdentity | null> => identity) },
    localLoginSessions: {
      createIfCurrent: vi.fn(async () => ({ ok: true as const, sessionId: 'session' })),
    },
    rateLimit: {
      store: { read: vi.fn(async () => 0), increment: vi.fn(async () => 1) },
      keyHasher: vi.fn(() => 'key'),
      now: () => now.getTime(),
    },
    generateToken: () => 'csrf',
    now: () => now,
  };
  return { deps, identity, run: () => loginLocalAccount(deps, input) };
}

describe('Đăng nhập local', () => {
  it('TC-744: đúng mật khẩu cấp phiên local 30 ngày và CSRF', async () => {
    const { run, deps } = fixture();
    expect(await run()).toEqual({
      ok: true,
      session: {
        sessionId: 'session',
        csrfToken: 'csrf',
        expiresAt: new Date('2026-12-14T00:00:00Z'),
        passwordChangeRequired: false,
      },
    });
    expect(deps.localLoginSessions.createIfCurrent).toHaveBeenCalledWith({
      accountId: 'account',
      expectedCredentialVersion: 1,
      csrfToken: 'csrf',
      expiresAt: new Date('2026-12-14T00:00:00Z'),
      passwordChangeRequired: false,
    });
    expect(deps.rateLimit.keyHasher).toHaveBeenCalledWith('login_failed', { ip: 'ip', username: 'me.lan' });
    expect(deps.rateLimit.store.increment).not.toHaveBeenCalled();
  });
  it('cắt khoảng trắng và chữ thường username như lúc đăng ký trước khi tra và đếm lượt', async () => {
    const { deps } = fixture();
    await loginLocalAccount(deps, { ...input, username: '  Me.Lan ' });
    expect(deps.identity.verifyPassword).toHaveBeenCalledWith('me.lan', 'secret');
    expect(deps.rateLimit.keyHasher).toHaveBeenCalledWith('login_failed', { ip: 'ip', username: 'me.lan' });
  });
  it('kết quả null ghi lượt sai và không cấp phiên', async () => {
    const { deps, run } = fixture();
    deps.identity.verifyPassword.mockResolvedValue(null);
    expect(await run()).toEqual({ ok: false, code: 'ERR_INVALID_CREDENTIALS' });
    expect(deps.rateLimit.store.increment).toHaveBeenCalledOnce();
    expect(deps.localLoginSessions.createIfCurrent).not.toHaveBeenCalled();
  });
  it('TC-747: snapshot đã khoá không cấp phiên và không ghi lượt sai', async () => {
    const { deps, identity, run } = fixture();
    identity.lockedAt = now;
    expect(await run()).toEqual({ ok: false, code: 'ERR_ACCOUNT_LOCKED' });
    expect(deps.rateLimit.store.increment).not.toHaveBeenCalled();
    expect(deps.localLoginSessions.createIfCurrent).not.toHaveBeenCalled();
  });
  it.each([-1, 0, 1])('hạn mật khẩu tạm so với now: %i ms', async (offset) => {
    const { deps, identity, run } = fixture();
    identity.mustChangePassword = true;
    identity.tempPasswordExpiresAt = new Date(now.getTime() + offset);
    const result = await run();
    if (offset <= 0) {
      expect(result).toEqual({ ok: false, code: 'ERR_INVALID_CREDENTIALS' });
      expect(deps.localLoginSessions.createIfCurrent).not.toHaveBeenCalled();
      expect(deps.rateLimit.store.increment).toHaveBeenCalledOnce();
    } else {
      expect(result).toMatchObject({ ok: true, session: { passwordChangeRequired: true } });
    }
  });
  it('chạm ngưỡng chặn trước hash và không tăng bucket', async () => {
    const { deps, run } = fixture();
    deps.rateLimit.store.read.mockResolvedValue(10);
    expect(await run()).toMatchObject({ ok: false, code: 'ERR_RATE_LIMITED', retryAfterSeconds: 900 });
    expect(deps.identity.verifyPassword).not.toHaveBeenCalled();
    expect(deps.rateLimit.store.increment).not.toHaveBeenCalled();
  });
  it.each(['read', 'verify', 'insert', 'hit', 'busy', 'timeout'])(
    'TC-907: lỗi hạ tầng %s trả unavailable, không báo sai mật khẩu',
    async (stage) => {
      const { deps, run } = fixture();
      const error = stage === 'busy' ? new PasswordHashBusyError() : new Error('DB/hash timeout');
      if (stage === 'read') deps.rateLimit.store.read.mockRejectedValue(error);
      else if (stage === 'insert') deps.localLoginSessions.createIfCurrent.mockRejectedValue(error);
      else if (stage === 'hit') {
        deps.identity.verifyPassword.mockResolvedValue(null);
        deps.rateLimit.store.increment.mockRejectedValue(error);
      } else deps.identity.verifyPassword.mockRejectedValue(error);
      expect(await run()).toEqual({
        ok: false,
        code: 'ERR_AUTH_UNAVAILABLE',
        reason: stage === 'busy' ? 'PasswordHashBusyError' : 'Error',
      });
      if (stage !== 'insert') expect(deps.localLoginSessions.createIfCurrent).not.toHaveBeenCalled();
    },
  );
  it.each(['gone', 'locked', 'stale'] as const)('recheck từ chối %s không ghi lượt sai', async (reason) => {
    const { deps } = fixture();
    const sessions = { createIfCurrent: async () => ({ ok: false as const, reason }) };
    expect(await loginLocalAccount({ ...deps, localLoginSessions: sessions }, input)).toEqual({
      ok: false,
      code: reason === 'locked' ? 'ERR_ACCOUNT_LOCKED' : 'ERR_INVALID_CREDENTIALS',
    });
    expect(deps.rateLimit.store.increment).not.toHaveBeenCalled();
  });
});
