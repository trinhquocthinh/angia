import type { ProfilesRepository, ProfileSession } from './ports';
import type { InvitationCreated } from './invitationPorts';
export interface InvitationManagerState {
  invitationState: 'none' | 'active' | 'uncertain';
  created: InvitationCreated | null;
  pending: boolean;
  error: Error | null;
  message: string;
}
export async function manageConsentInvitation(
  repository: ProfilesRepository,
  session: ProfileSession,
  profileId: string,
  operation: 'create' | 'revoke',
  update: (state: InvitationManagerState) => void,
): Promise<boolean> {
  const state: InvitationManagerState = {
    invitationState: 'uncertain',
    created: null,
    pending: true,
    error: null,
    message: '',
  };
  update(state);
  if (session.role !== 'main' || !session.family || !session.csrfToken) {
    update({
      ...state,
      pending: false,
      error: new Error('Chỉ người chăm sóc chính có thể quản lý link đồng thuận.'),
    });
    return false;
  }
  try {
    if (operation === 'create') {
      const created = await repository.createInvitation(profileId, session.csrfToken);
      update({ ...state, invitationState: 'active', created, pending: false });
    } else {
      await repository.revokeInvitation(profileId, session.csrfToken);
      update({ ...state, invitationState: 'none', pending: false, message: 'Đã thu hồi link chờ phản hồi.' });
    }
    return true;
  } catch (cause) {
    update({
      ...state,
      pending: false,
      error: cause instanceof Error ? cause : new Error('Không thể quản lý link. Vui lòng thử lại.'),
      message:
        'Chưa xác định được trạng thái link. Không sử dụng link cũ; hãy tạo link mới hoặc thử thu hồi lại.',
    });
    return false;
  }
}
