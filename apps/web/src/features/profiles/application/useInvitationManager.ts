import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ProfilesRepository, ProfileSession } from './ports';
import { manageProfileLink } from './manageProfileLink';
import type { InvitationManagerState } from './manageProfileLink';
import { profileScopeKey } from './profileScopeKey';
import { useProfileSessionRecovery } from './useProfileSessionRecovery';
export function useInvitationManager(
  repository: ProfilesRepository,
  session: ProfileSession,
  profileId: string,
) {
  const client = useQueryClient();
  const [state, setState] = useState<InvitationManagerState>({
    // API không cho biết có link đang chờ hay không; thu hồi là idempotent nên luôn cho phép khi mới mở.
    invitationState: 'uncertain',
    created: null,
    pending: false,
    error: null,
    message: '',
  });
  const sending = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useProfileSessionRecovery(state.error);
  const execute = async (operation: 'create' | 'revoke') => {
    if (sending.current) return;
    sending.current = true;
    try {
      const success = await manageProfileLink(repository, session, profileId, operation, (next) => {
        if (alive.current) setState(next);
      });
      if (success) await client.invalidateQueries({ queryKey: profileScopeKey(session) });
    } finally {
      sending.current = false;
    }
  };
  return { ...state, create: () => execute('create'), revoke: () => execute('revoke') };
}
