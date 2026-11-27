import { describe, expect, it, vi } from 'vitest';
import { PasswordHashBusyError } from '@src/shared/identity/application/PasswordHashBusyError.js';
import { changeLocalPassword } from './changeLocalPassword.js';

function fixture() {
  const credential = { usernameNormalized: 'me.lan123', passwordHash: 'old-hash', credentialVersion: 4 };
  const deps = {
    passwords: {
      findCredential: vi.fn(async (): Promise<typeof credential | null> => credential),
      replaceIfCurrent: vi.fn(async () => ({ ok: true as const })),
    },
    hasher: {
      hash: vi.fn(async () => 'new-hash'),
      verify: vi.fn(async () => true),
      needsRehash: () => false,
    },
    rateLimit: {
      store: { read: vi.fn(async () => 0), increment: vi.fn(async () => 1) },
      keyHasher: vi.fn(() => 'key'),
      now: () => 0,
    },
    now: () => new Date(0),
  };
  const input = {
    accountId: 'account',
    sessionId: 'session',
    passwordChangeRequired: false,
    currentPassword: 'old-password',
    newPassword: 'new-password',
    ip: 'ip',
  };
  return { deps, input, run: () => changeLocalPassword(deps, input) };
}
describe('Đổi mật khẩu local', () => {
  it.each(['gone', 'locked', 'stale'] as const)('transaction từ chối %s trả đúng lỗi', async (reason) => {
    const { deps, input } = fixture();
    const passwords = { ...deps.passwords, replaceIfCurrent: async () => ({ ok: false as const, reason }) };
    expect(await changeLocalPassword({ ...deps, passwords }, input)).toEqual({
      ok: false,
      code: reason === 'locked' ? 'ERR_ACCOUNT_LOCKED' : 'ERR_INVALID_CREDENTIALS',
    });
    expect(deps.rateLimit.store.increment).not.toHaveBeenCalled();
  });
  it('phiên thường đúng mật khẩu cũ ghi hash mới với version đã đọc', async () => {
    const { deps, run } = fixture();
    expect(await run()).toEqual({ ok: true });
    expect(deps.hasher.verify).toHaveBeenCalledWith('old-hash', 'old-password');
    expect(deps.passwords.replaceIfCurrent).toHaveBeenCalledWith({
      accountId: 'account',
      sessionId: 'session',
      expectedCredentialVersion: 4,
      passwordHash: 'new-hash',
      now: new Date(0),
    });
    expect(deps.rateLimit.keyHasher).toHaveBeenCalledWith('login_failed', {
      ip: 'ip',
      username: 'me.lan123',
    });
  });
  it('sai mật khẩu cũ trả 401 và ghi đúng một lượt sai', async () => {
    const { deps, run } = fixture();
    deps.hasher.verify.mockResolvedValue(false);
    expect(await run()).toEqual({ ok: false, code: 'ERR_INVALID_CREDENTIALS' });
    expect(deps.rateLimit.store.increment).toHaveBeenCalledOnce();
    expect(deps.hasher.hash).not.toHaveBeenCalled();
    expect(deps.passwords.replaceIfCurrent).not.toHaveBeenCalled();
  });
  it('đang bị chặn trả 429 trước verify hash', async () => {
    const { deps, run } = fixture();
    deps.rateLimit.store.read.mockResolvedValue(10);
    expect(await run()).toMatchObject({ code: 'ERR_RATE_LIMITED', retryAfterSeconds: 900 });
    expect(deps.hasher.verify).not.toHaveBeenCalled();
  });
  it('thiếu mật khẩu cũ trả lỗi đúng trường', async () => {
    const { deps, input } = fixture();
    expect(await changeLocalPassword(deps, { ...input, currentPassword: undefined })).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { field: 'currentPassword' },
    });
  });
  it.each(['short', 'ME.LAN123'])('mật khẩu mới %s bị từ chối trước verify', async (newPassword) => {
    const { deps, input } = fixture();
    expect(await changeLocalPassword(deps, { ...input, newPassword })).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { field: 'newPassword' },
    });
    expect(deps.hasher.verify).not.toHaveBeenCalled();
  });
  it('phiên hạn chế bỏ qua mật khẩu cũ và limiter, chỉ so mật khẩu mới với mật khẩu tạm', async () => {
    const { deps, input } = fixture();
    deps.hasher.verify.mockResolvedValue(false);
    expect(
      await changeLocalPassword(deps, { ...input, passwordChangeRequired: true, currentPassword: undefined }),
    ).toEqual({ ok: true });
    expect(deps.hasher.verify).toHaveBeenCalledExactlyOnceWith('old-hash', 'new-password');
    expect(deps.rateLimit.store.read).not.toHaveBeenCalled();
  });
  it('phiên hạn chế đặt mật khẩu mới trùng mật khẩu tạm trả 422 trước hash', async () => {
    const { deps, input } = fixture();
    expect(
      await changeLocalPassword(deps, { ...input, passwordChangeRequired: true, currentPassword: undefined }),
    ).toEqual({ ok: false, code: 'ERR_VALIDATION', details: { field: 'newPassword' } });
    expect(deps.hasher.hash).not.toHaveBeenCalled();
    expect(deps.passwords.replaceIfCurrent).not.toHaveBeenCalled();
    expect(deps.rateLimit.store.increment).not.toHaveBeenCalled();
  });
  it('account chỉ OIDC trả 401 trước validate', async () => {
    const { deps, input } = fixture();
    deps.passwords.findCredential.mockResolvedValue(null);
    expect(await changeLocalPassword(deps, { ...input, newPassword: 'short' })).toEqual({
      ok: false,
      code: 'ERR_INVALID_CREDENTIALS',
    });
  });
  it.each(['read', 'limit', 'verify', 'hash', 'busy', 'hit', 'transaction'])(
    'lỗi %s trả 503',
    async (stage) => {
      const { deps, run } = fixture();
      const error = stage === 'busy' ? new PasswordHashBusyError() : new Error('secret');
      if (stage === 'read') deps.passwords.findCredential.mockRejectedValue(error);
      else if (stage === 'limit') deps.rateLimit.store.read.mockRejectedValue(error);
      else if (stage === 'verify') deps.hasher.verify.mockRejectedValue(error);
      else if (stage === 'hit') {
        deps.hasher.verify.mockResolvedValue(false);
        deps.rateLimit.store.increment.mockRejectedValue(error);
      } else if (stage === 'transaction') deps.passwords.replaceIfCurrent.mockRejectedValue(error);
      else deps.hasher.hash.mockRejectedValue(error);
      expect(await run()).toEqual({ ok: false, code: 'ERR_AUTH_UNAVAILABLE', reason: error.name });
      if (stage !== 'transaction') expect(deps.passwords.replaceIfCurrent).not.toHaveBeenCalled();
    },
  );
});
