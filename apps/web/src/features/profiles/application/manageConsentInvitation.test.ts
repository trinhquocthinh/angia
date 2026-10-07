import { describe, expect, it, vi } from 'vitest';
import type { ProfilesRepository, ProfileSession } from './ports';
import type { InvitationManagerState } from './manageConsentInvitation';
import { manageConsentInvitation } from './manageConsentInvitation';
const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'f', name: 'Nhà An' },
  role: 'main',
  csrfToken: 'csrf',
};
function repository(): ProfilesRepository {
  return {
    list: vi.fn(),
    linkableAccounts: vi.fn(),
    create: vi.fn(),
    createInvitation: vi.fn(async () => ({ token: 'v1.current', expiresAt: '2026-10-13T00:00:00Z' })),
    revokeInvitation: vi.fn(async () => undefined),
    logout: vi.fn(),
  };
}
describe('TC-106 — Trạng thái link khi tạo lại, thu hồi hoặc mất phản hồi', () => {
  it.each(['create', 'revoke'] as const)(
    'bỏ raw token ngay trước %s, lỗi không giữ link có thể đã hết hiệu lực',
    async (operation) => {
      const repo = repository();
      let finish: () => void = () => undefined;
      const wait = new Promise<void>((resolve) => {
        finish = resolve;
      });
      repo.createInvitation = async () => {
        await wait;
        throw new Error('Mạng gián đoạn');
      };
      repo.revokeInvitation = async () => {
        await wait;
        throw new Error('Mạng gián đoạn');
      };
      let state: InvitationManagerState = {
        invitationState: 'active',
        created: { token: 'v1.old', expiresAt: '2026-10-13T00:00:00Z' },
        pending: false,
        error: null,
        message: '',
      };
      const task = manageConsentInvitation(repo, session, 'p', operation, (next) => {
        state = next;
      });
      expect(state.created).toBeNull();
      expect(state.pending).toBe(true);
      expect(state.invitationState).toBe('uncertain');
      finish();
      await task;
      expect(state.created).toBeNull();
      expect(state.invitationState).toBe('uncertain');
      expect(state.message).toContain('Không sử dụng link cũ');
    },
  );
  it('thu hồi thành công chuyển none để không hiện nút thu hồi hoặc Tạo lại', async () => {
    const update = vi.fn();
    expect(await manageConsentInvitation(repository(), session, 'p', 'revoke', update)).toBe(true);
    expect(update).toHaveBeenLastCalledWith(
      expect.objectContaining({ invitationState: 'none', created: null, pending: false }),
    );
  });
  it('chỉ giữ raw token sau phản hồi tạo thành công', async () => {
    const update = vi.fn();
    await manageConsentInvitation(repository(), session, 'p', 'create', update);
    expect(update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ created: null, invitationState: 'uncertain' }),
    );
    expect(update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        invitationState: 'active',
        created: { token: 'v1.current', expiresAt: '2026-10-13T00:00:00Z' },
      }),
    );
  });
});
