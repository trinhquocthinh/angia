import { describe, expect, it, vi } from 'vitest';
import { respondToInvitation } from './respondToInvitation.js';
import type { Invitation, InvitationClaims } from '../domain/Invitation.js';
import type { InvitationDependencies, InvitationStore } from './ports.js';

const claims: InvitationClaims = { familyId: 'family', profileId: 'profile', invitationId: 'invite' };
const date = new Date('2026-10-06T00:00:00Z');
const invitation: Invitation = {
  id: 'invite',
  familyId: 'family',
  profileId: 'profile',
  tokenHash: 'hash',
  invitedByAccountId: 'account',
  expiresAt: new Date('2026-10-13T00:00:00Z'),
  revokedAt: null,
  decision: null,
  respondentName: null,
  basis: null,
  respondedAt: null,
};
function fixture(row: Invitation | null = { ...invitation }) {
  const store = {
    lockProfile: vi.fn().mockResolvedValue({ id: 'profile' }),
    lockInvitation: vi.fn().mockResolvedValue(row),
    recordResponse: vi.fn().mockResolvedValue(undefined),
  } as unknown as InvitationStore;
  const deps = {
    repository: { withFamily: vi.fn(async (_id, work) => work(store)) },
    codec: { verify: vi.fn().mockReturnValue(claims), hash: () => 'hash' },
    now: () => date,
  } as unknown as InvitationDependencies;
  return { deps, store };
}
describe('Người nhận phản hồi link', () => {
  it('chỉ phạm vi token đã xác thực, khóa hồ sơ trước lời mời và ghi quyết định đầu', async () => {
    const { deps, store } = fixture();
    expect(
      await respondToInvitation(deps, 'token', { decision: 'accepted', basis: 'self', respondentName: 'An' }),
    ).toEqual({
      ok: true,
      value: {
        outcome: 'recorded',
        decision: 'accepted',
        basis: 'self',
        respondentName: 'An',
        respondedAt: date,
      },
    });
    expect(deps.repository.withFamily).toHaveBeenCalledWith('family', expect.any(Function));
    expect(store.lockProfile).toHaveBeenCalledWith('profile');
    expect(vi.mocked(store.lockProfile).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(store.lockInvitation).mock.invocationCallOrder[0]!,
    );
    expect(store.recordResponse).toHaveBeenCalledWith(
      invitation,
      { decision: 'accepted', basis: 'self', respondentName: 'An' },
      date,
    );
  });
  it('lặp lại giữ nguyên metadata đầu, không ghi đè', async () => {
    const { deps, store } = fixture({
      ...invitation,
      decision: 'declined',
      basis: 'guardian',
      respondentName: 'Bình',
      respondedAt: date,
    });
    const result = await respondToInvitation(deps, 'token', {
      decision: 'accepted',
      basis: 'self',
      respondentName: 'Khác',
    });
    expect(result).toMatchObject({
      ok: true,
      value: {
        outcome: 'already_responded',
        decision: 'declined',
        respondentName: 'Bình',
        basis: 'guardian',
      },
    });
    expect(store.recordResponse).not.toHaveBeenCalled();
  });
  it.each([
    null,
    { ...invitation, revokedAt: date },
    { ...invitation, expiresAt: date },
    { ...invitation, tokenHash: 'wrong' },
  ])('token hết hạn, thu hồi hoặc không khớp trả cùng lỗi', async (row) => {
    const { deps, store } = fixture(row);
    expect(
      await respondToInvitation(deps, 'token', { decision: 'accepted', basis: 'self', respondentName: 'An' }),
    ).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    expect(store.recordResponse).not.toHaveBeenCalled();
  });
  it('token không xác thực không truy vấn dữ liệu', async () => {
    const { deps } = fixture();
    vi.mocked(deps.codec.verify).mockReturnValue(null);
    expect(
      await respondToInvitation(deps, 'bad', { decision: 'accepted', basis: 'self', respondentName: 'An' }),
    ).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    expect(deps.repository.withFamily).not.toHaveBeenCalled();
  });
});
