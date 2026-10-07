import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ProfilesRepository, ProfileSession } from './ports';
import { manageConsentInvitation } from './manageConsentInvitation';
import type { InvitationManagerState } from './manageConsentInvitation';
import { profileScopeKey } from './profileScopeKey';
import { useProfileSessionRecovery } from './useProfileSessionRecovery';
export function useInvitationManager(
  repository: ProfilesRepository,
  session: ProfileSession,
  profileId: string,
  invited = false,
) {
  const client = useQueryClient();
  const [state, setState] = useState<InvitationManagerState>({
    invitationState: invited ? 'active' : 'none',
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
      const success = await manageConsentInvitation(repository, session, profileId, operation, (next) => {
        if (alive.current) setState(next);
      });
      if (success) await client.invalidateQueries({ queryKey: profileScopeKey(session) });
    } finally {
      sending.current = false;
    }
  };
  return { ...state, create: () => execute('create'), revoke: () => execute('revoke') };
}
