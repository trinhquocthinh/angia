import { describe, expect, it, vi } from 'vitest';
import { createInvitation } from './createInvitation.js';
import { revokeInvitation } from './revokeInvitation.js';
import { viewInvitation } from './viewInvitation.js';
import type { InvitationDependencies, InvitationStore } from './ports.js';

const at = new Date('2026-10-06T00:00:00Z');
const claims = { familyId: 'family', profileId: 'profile', invitationId: 'invite' };
function fixture(status: string | null = 'pending') {
  const store = {
    lockProfile: vi
      .fn()
      .mockResolvedValue(status ? { id: 'profile', displayName: 'An', consentStatus: status } : null),
    lockInvitation: vi.fn().mockResolvedValue({
      tokenHash: 'hash',
      expiresAt: new Date(at.getTime() + 86400000),
      revokedAt: null,
      decision: null,
      invitedByAccountId: 'inviter',
    }),
    inviterName: vi.fn().mockResolvedValue('Người chăm'),
    revokePending: vi.fn(),
    insertInvitation: vi.fn(),
    setStatus: vi.fn(),
  } as unknown as InvitationStore;
  const deps = {
    repository: { withFamily: vi.fn(async (_id, work) => work(store)) },
    codec: {
      issue: vi.fn().mockReturnValue('token'),
      verify: vi.fn().mockReturnValue(claims),
      hash: () => 'hash',
    },
    now: () => at,
    newId: () => 'invite',
  } as unknown as InvitationDependencies;
  return { deps, store };
}
describe('Quản lý và xem link đồng thuận', () => {
  it('tạo/rotation thu hồi pending trước chèn mới, hạn 7 ngày và status invited', async () => {
    const { deps, store } = fixture('declined');
    const result = await createInvitation(deps, 'family', 'profile', 'main');
    expect(result).toEqual({
      ok: true,
      value: { token: 'token', expiresAt: new Date(at.getTime() + 7 * 86400000) },
    });
    expect(store.revokePending).toHaveBeenCalledWith('profile', at);
    expect(store.insertInvitation).toHaveBeenCalledWith(
      expect.objectContaining({ tokenHash: 'hash', invitedByAccountId: 'main', decision: null }),
    );
    expect(vi.mocked(store.revokePending).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(store.insertInvitation).mock.invocationCallOrder[0]!,
    );
    expect(store.setStatus).toHaveBeenCalledWith('profile', 'invited');
  });
  it.each([null, 'confirmed'])(
    'không tồn tại hoặc đã confirmed thì create/revoke không ghi',
    async (status) => {
      const { deps, store } = fixture(status);
      const expected = { ok: false, code: status ? 'ERR_CONSENT_ALREADY_CONFIRMED' : 'ERR_NOT_FOUND' };
      expect(await createInvitation(deps, 'family', 'profile', 'main')).toEqual(expected);
      expect(await revokeInvitation(deps, 'family', 'profile')).toEqual(expected);
      expect(store.revokePending).not.toHaveBeenCalled();
      expect(store.insertInvitation).not.toHaveBeenCalled();
      expect(store.setStatus).not.toHaveBeenCalled();
    },
  );
  it('thu hồi pending và trả trạng thái pending', async () => {
    const { deps, store } = fixture('invited');
    expect(await revokeInvitation(deps, 'family', 'profile')).toEqual({
      ok: true,
      value: { status: 'pending' },
    });
    expect(store.revokePending).toHaveBeenCalledWith('profile', at);
    expect(store.setStatus).toHaveBeenCalledWith('profile', 'pending');
  });
  it('view chỉ trả DTO tối thiểu và không ghi', async () => {
    const { deps, store } = fixture();
    expect(await viewInvitation(deps, 'token')).toEqual({
      ok: true,
      value: {
        profileDisplayName: 'An',
        inviterDisplayName: 'Người chăm',
        expiresAt: new Date(at.getTime() + 86400000),
        status: 'pending',
      },
    });
    expect(store.revokePending).not.toHaveBeenCalled();
    expect(store.setStatus).not.toHaveBeenCalled();
  });
  it('view lỗi token, thiếu hồ sơ hoặc hết hạn trả 404 đồng nhất', async () => {
    const { deps, store } = fixture(null);
    expect(await viewInvitation(deps, 'token')).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    vi.mocked(store.lockProfile).mockResolvedValue({ id: 'profile' } as never);
    vi.mocked(store.lockInvitation).mockResolvedValue(null);
    expect(await viewInvitation(deps, 'token')).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    vi.mocked(deps.codec.verify).mockReturnValue(null);
    expect(await viewInvitation(deps, 'bad')).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
  });
});
