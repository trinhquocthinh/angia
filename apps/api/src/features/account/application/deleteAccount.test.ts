import { describe, expect, it, vi } from 'vitest';
import { profileObjectPrefix } from '@angia/contracts';
import type { AccountDeletionStoreResult } from './deletionPorts.js';
import { deleteAccount } from './deleteAccount.js';

function fixture() {
  const credential = { usernameNormalized: 'me.lan123', passwordHash: 'hash', credentialVersion: 4 };
  const deps = {
    passwords: { findCredential: vi.fn(async (): Promise<typeof credential | null> => credential) },
    hasher: { hash: vi.fn(async () => 'hash'), verify: vi.fn(async () => true), needsRehash: () => false },
    rateLimit: {
      store: { read: vi.fn(async () => 0), increment: vi.fn(async () => 1) },
      keyHasher: vi.fn(() => 'key'),
      now: () => 0,
    },
    store: {
      deleteAccount: vi.fn(async (): Promise<AccountDeletionStoreResult> => ({
        ok: true,
        familyId: null,
        deletedProfileId: null,
      })),
    },
    hashUsername: vi.fn(() => 'username-hash'),
    storage: { deletePrefix: vi.fn(async () => 0) },
    logger: { warn: vi.fn() },
  };
  const input = {
    accountId: 'account',
    password: 'password',
    ownProfileDisposition: 'delete' as const,
    ip: 'ip',
  };
  return { deps, input, run: () => deleteAccount(deps, input) };
}

describe('Xoá tài khoản', () => {
  it('TC-830 sai mật khẩu ghi lượt sai và không gọi store', async () => {
    const { deps, run } = fixture();
    deps.hasher.verify.mockResolvedValue(false);
    expect(await run()).toEqual({ ok: false, code: 'ERR_INVALID_CREDENTIALS' });
    expect(deps.rateLimit.store.increment).toHaveBeenCalledOnce();
    expect(deps.store.deleteAccount).not.toHaveBeenCalled();
    expect(deps.rateLimit.keyHasher).toHaveBeenCalledWith('login_failed', {
      ip: 'ip',
      username: 'me.lan123',
    });
  });
  it('TC-830 không có credential local trả lỗi xác thực', async () => {
    const { deps, run } = fixture();
    deps.passwords.findCredential.mockResolvedValue(null);
    expect(await run()).toEqual({ ok: false, code: 'ERR_INVALID_CREDENTIALS' });
    expect(deps.store.deleteAccount).not.toHaveBeenCalled();
  });
  it('TC-830 chặn tần suất trước kiểm mật khẩu', async () => {
    const { deps, run } = fixture();
    deps.rateLimit.store.read.mockResolvedValue(10);
    expect(await run()).toEqual({ ok: false, code: 'ERR_RATE_LIMITED', retryAfterSeconds: 900 });
    expect(deps.hasher.verify).not.toHaveBeenCalled();
    expect(deps.store.deleteAccount).not.toHaveBeenCalled();
  });
  it('TC-829 giữ nguyên lỗi của store và chi tiết hồ sơ', async () => {
    const { deps, run } = fixture();
    const failure = {
      ok: false as const,
      code: 'ERR_OWNER_MUST_TRANSFER' as const,
      details: { profileIds: ['profile'] },
    };
    deps.store.deleteAccount.mockResolvedValue(failure);
    expect(await run()).toEqual(failure);
    expect(deps.storage.deletePrefix).not.toHaveBeenCalled();
  });
  it('TC-827 xác nhận version và băm đúng username chuẩn hoá', async () => {
    const { deps, run } = fixture();
    expect(await run()).toEqual({ ok: true });
    expect(deps.hashUsername).toHaveBeenCalledWith('me.lan123');
    expect(deps.store.deleteAccount).toHaveBeenCalledWith({
      accountId: 'account',
      expectedCredentialVersion: 4,
      usernameHash: 'username-hash',
      ownProfileDisposition: 'delete',
    });
    expect(deps.hasher.verify).toHaveBeenCalledWith('hash', 'password');
  });
  it('TC-827 xoá prefix ảnh sau khi store thành công', async () => {
    const { deps, run } = fixture();
    deps.store.deleteAccount.mockResolvedValue({ ok: true, familyId: 'family', deletedProfileId: 'profile' });
    expect(await run()).toEqual({ ok: true });
    expect(deps.storage.deletePrefix).toHaveBeenCalledWith(profileObjectPrefix('family', 'profile'));
    expect(deps.store.deleteAccount.mock.invocationCallOrder[0]).toBeLessThan(
      deps.storage.deletePrefix.mock.invocationCallOrder[0]!,
    );
  });
  it('TC-827 lỗi xoá ảnh vẫn thành công và chỉ log ID cùng loại lỗi', async () => {
    const { deps, run } = fixture();
    deps.store.deleteAccount.mockResolvedValue({ ok: true, familyId: 'family', deletedProfileId: 'profile' });
    deps.storage.deletePrefix.mockRejectedValue(new TypeError('password secret'));
    expect(await run()).toEqual({ ok: true });
    expect(deps.logger.warn).toHaveBeenCalledWith(
      { familyId: 'family', profileId: 'profile', reason: 'TypeError' },
      expect.any(String),
    );
  });
  it.each(['credential', 'limit', 'verify', 'store', 'hash', 'hit'])(
    'TC-830 lỗi bất ngờ tại %s không lộ dữ liệu',
    async (stage) => {
      const { deps, run } = fixture();
      const error = new TypeError('secret');
      if (stage === 'credential') deps.passwords.findCredential.mockRejectedValue(error);
      if (stage === 'limit') deps.rateLimit.store.read.mockRejectedValue(error);
      if (stage === 'verify') deps.hasher.verify.mockRejectedValue(error);
      if (stage === 'store') deps.store.deleteAccount.mockRejectedValue(error);
      if (stage === 'hash')
        deps.hashUsername.mockImplementation(() => {
          throw error;
        });
      if (stage === 'hit') {
        deps.hasher.verify.mockResolvedValue(false);
        deps.rateLimit.store.increment.mockRejectedValue(error);
      }
      expect(await run()).toEqual({ ok: false, code: 'ERR_AUTH_UNAVAILABLE', reason: 'TypeError' });
    },
  );
});
