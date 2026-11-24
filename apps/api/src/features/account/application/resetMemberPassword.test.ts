import { describe, expect, it, vi } from 'vitest';
import { validateNewPassword } from '../domain/validateNewPassword.js';
import { resetMemberPassword } from './resetMemberPassword.js';

const now = new Date('2026-11-21T00:00:00Z');
const actor = {
  accountId: 'actor',
  familyId: 'family' as string | null,
  role: 'main' as 'main' | 'member' | null,
};
function fixture() {
  const deps = {
    memberPasswordResets: {
      authorize: vi.fn(async () => ({ ok: true as const, usernameNormalized: 'me.lan' })),
      reset: vi.fn(async () => ({ ok: true as const })),
    },
    hasher: { hash: vi.fn(async () => 'hash'), verify: vi.fn(), needsRehash: () => false },
    now: () => now,
  };
  return { deps, run: () => resetMemberPassword(deps, actor, 'target') };
}
describe('Đặt lại mật khẩu thành viên', () => {
  it.each([
    [{ ...actor, familyId: null }, 'target'],
    [{ ...actor, role: 'member' as const }, 'target'],
    [{ ...actor, role: null }, 'target'],
    [actor, 'actor'],
  ])('TC-758 TC-759: chặn quyền trước đọc và hash: %j', async (caller, target) => {
    const { deps } = fixture();
    expect(await resetMemberPassword(deps, caller, target)).toEqual({ ok: false, code: 'ERR_FORBIDDEN' });
    expect(deps.memberPasswordResets.authorize).not.toHaveBeenCalled();
    expect(deps.hasher.hash).not.toHaveBeenCalled();
  });
  it.each(['ERR_OWNER_PROTECTED', 'ERR_NOT_FOUND', 'ERR_FORBIDDEN', 'ERR_UNAUTHENTICATED'] as const)(
    'TC-757 TC-760: repository từ chối %s không hash',
    async (code) => {
      const { deps } = fixture();
      const memberPasswordResets = {
        ...deps.memberPasswordResets,
        authorize: async () => ({ ok: false as const, code }),
      };
      expect(await resetMemberPassword({ ...deps, memberPasswordResets }, actor, 'target')).toEqual({
        ok: false,
        code,
      });
      expect(deps.hasher.hash).not.toHaveBeenCalled();
      expect(deps.memberPasswordResets.reset).not.toHaveBeenCalled();
    },
  );
  it('TC-756: mật khẩu crypto hợp lệ và khác nhau, hạn đúng 24 giờ, chỉ gửi hash tới repo', async () => {
    const { deps, run } = fixture();
    const passwords = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const result = await run();
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('Đặt lại thất bại');
      const { temporaryPassword, expiresAt } = result.value;
      expect(temporaryPassword.length).toBeGreaterThanOrEqual(16);
      expect(validateNewPassword(temporaryPassword, 'me.lan')).toBe(true);
      expect(expiresAt).toEqual(new Date('2026-11-22T00:00:00Z'));
      expect(deps.hasher.hash).toHaveBeenLastCalledWith(temporaryPassword);
      expect(deps.memberPasswordResets.reset).toHaveBeenLastCalledWith(actor, 'target', {
        passwordHash: 'hash',
        now,
        expiresAt,
      });
      passwords.add(temporaryPassword);
    }
    expect(passwords.size).toBe(20);
  });
  it('quyền đổi trong lúc hash không trả mật khẩu', async () => {
    const { deps } = fixture();
    const memberPasswordResets = {
      ...deps.memberPasswordResets,
      reset: async () => ({ ok: false as const, code: 'ERR_FORBIDDEN' as const }),
    };
    expect(await resetMemberPassword({ ...deps, memberPasswordResets }, actor, 'target')).toEqual({
      ok: false,
      code: 'ERR_FORBIDDEN',
    });
  });
  it('hash lỗi không ghi và chỉ trả tên lớp lỗi', async () => {
    const { deps, run } = fixture();
    deps.hasher.hash.mockRejectedValue(new Error('bí mật'));
    expect(await run()).toEqual({ ok: false, code: 'ERR_AUTH_UNAVAILABLE', reason: 'Error' });
    expect(deps.memberPasswordResets.reset).not.toHaveBeenCalled();
  });
});
