import { describe, expect, it, vi } from 'vitest';
import { PasswordHashBusyError } from '@src/shared/identity/application/PasswordHashBusyError.js';
import { enrollLocalCredential } from './enrollLocalCredential.js';
import type { EnrollLocalCredentialDeps, EnrollmentAccount, EnrollmentInsertOutcome } from './ports.js';

function fixture() {
  const account: EnrollmentAccount = { oidcSubject: 'sub', usernameNormalized: 'me.lan123', lockedAt: null };
  const deps = {
    enrollmentEnabled: true as boolean,
    enrollments: {
      findAccount: vi.fn(async (): Promise<EnrollmentAccount | null> => account),
      insertIfAbsent: vi.fn(async (): Promise<EnrollmentInsertOutcome> => ({ ok: true })),
    },
    hasher: { hash: vi.fn(async () => 'hash'), verify: vi.fn(), needsRehash: () => false },
    now: () => new Date('2026-11-14T00:05:00Z'),
  } satisfies EnrollLocalCredentialDeps;
  const input = {
    accountId: 'account',
    sessionId: 'session',
    authMethod: 'oidc' as 'oidc' | 'local',
    oidcAuthTime: new Date('2026-11-14T00:04:00Z') as Date | null,
    password: 'NewPassword123',
  };
  return { account, deps, input, run: () => enrollLocalCredential(deps, input) };
}
describe('Thiết lập credential local một lần', () => {
  it('TC-900: thành công hash rồi ghi đúng account và phiên hiện tại', async () => {
    const { deps, input, run } = fixture();
    expect(await run()).toEqual({ ok: true });
    expect(deps.enrollments.insertIfAbsent).toHaveBeenCalledWith({
      accountId: input.accountId,
      sessionId: input.sessionId,
      passwordHash: 'hash',
      now: deps.now(),
    });
  });
  it('TC-902: cờ tắt trả 404 không đọc account hoặc hash', async () => {
    const { deps, run } = fixture();
    deps.enrollmentEnabled = false;
    expect(await run()).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    expect(deps.enrollments.findAccount).not.toHaveBeenCalled();
    expect(deps.hasher.hash).not.toHaveBeenCalled();
  });
  it.each(['local', 'missing', 'old'] as const)('TC-901: phiên %s trả 403 trước hash', async (kind) => {
    const { deps, input, run } = fixture();
    if (kind === 'local') input.authMethod = 'local';
    if (kind === 'missing') input.oidcAuthTime = null;
    if (kind === 'old') input.oidcAuthTime = new Date(deps.now().getTime() - 360000);
    expect(await run()).toEqual({ ok: false, code: 'ERR_FORBIDDEN' });
    expect(deps.hasher.hash).not.toHaveBeenCalled();
    expect(deps.enrollments.findAccount).not.toHaveBeenCalled();
  });
  it('TC-901: account thiếu subject trả 403 trước hash', async () => {
    const { account, deps, run } = fixture();
    account.oidcSubject = null;
    expect(await run()).toEqual({ ok: false, code: 'ERR_FORBIDDEN' });
    expect(deps.hasher.hash).not.toHaveBeenCalled();
  });
  it.each(['short', 'ME.LAN123'])('TC-901: mật khẩu yếu %s trả 422 đúng trường', async (password) => {
    const { deps, input, run } = fixture();
    input.password = password;
    expect(await run()).toEqual({ ok: false, code: 'ERR_VALIDATION', details: { field: 'password' } });
    expect(deps.hasher.hash).not.toHaveBeenCalled();
  });
  it('TC-900: username null vẫn cho thiết lập và mốc 300 giây được chấp nhận', async () => {
    const { account, deps, input, run } = fixture();
    account.usernameNormalized = null;
    input.oidcAuthTime = new Date(deps.now().getTime() - 300000);
    expect(await run()).toEqual({ ok: true });
  });
  it.each(['gone', 'locked'] as const)('TC-901: account %s trước hash trả đúng lỗi', async (reason) => {
    const { account, deps, run } = fixture();
    if (reason === 'gone') deps.enrollments.findAccount.mockResolvedValue(null);
    else account.lockedAt = deps.now();
    expect(await run()).toEqual({
      ok: false,
      code: reason === 'gone' ? 'ERR_UNAUTHENTICATED' : 'ERR_ACCOUNT_LOCKED',
    });
    expect(deps.hasher.hash).not.toHaveBeenCalled();
  });
  it.each([
    ['gone', 'ERR_UNAUTHENTICATED'],
    ['locked', 'ERR_ACCOUNT_LOCKED'],
    ['forbidden', 'ERR_FORBIDDEN'],
    ['exists', 'ERR_CREDENTIAL_ALREADY_SET'],
  ] as const)('TC-902: transaction từ chối %s không ghi đè', async (reason, code) => {
    const { deps, run } = fixture();
    deps.enrollments.insertIfAbsent.mockResolvedValue({ ok: false, reason });
    expect(await run()).toEqual({ ok: false, code });
  });
  it.each(['read', 'hash', 'busy', 'transaction'])(
    'TC-902: lỗi %s trả 503 chỉ tên lớp lỗi',
    async (stage) => {
      const { deps, run } = fixture();
      const error = stage === 'busy' ? new PasswordHashBusyError() : new Error('bí mật');
      if (stage === 'read') deps.enrollments.findAccount.mockRejectedValue(error);
      else if (stage === 'transaction') deps.enrollments.insertIfAbsent.mockRejectedValue(error);
      else deps.hasher.hash.mockRejectedValue(error);
      expect(await run()).toEqual({ ok: false, code: 'ERR_AUTH_UNAVAILABLE', reason: error.name });
    },
  );
});
