import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ConsentConfirmation, ProfileListItem, ProfilesRepository, ProfileSession } from './ports';
import { ProfileRequestError } from './ProfileRequestError';
import { profileScopeKey } from './profileScopeKey';
import { useProfileSessionRecovery } from './useProfileSessionRecovery';

export function useConfirmProfileConsent(
  repository: ProfilesRepository,
  session: ProfileSession,
  profile: ProfileListItem,
) {
  const client = useQueryClient();
  const sending = useRef(false);
  const refresh = () => client.invalidateQueries({ queryKey: profileScopeKey(session) });
  const mutation = useMutation({
    mutationFn: (body: ConsentConfirmation) => repository.confirmConsent(profile.id, body, session.csrfToken),
    onSuccess: async () => {
      await Promise.all([refresh(), client.invalidateQueries({ queryKey: ['current-session'] })]);
    },
    onError: async (error) => {
      if (error instanceof ProfileRequestError && [404, 409].includes(error.status)) await refresh();
    },
  });
  useProfileSessionRecovery(mutation.error);
  const submit = async (body: ConsentConfirmation) => {
    if (
      sending.current ||
      session.role !== 'main' ||
      !session.csrfToken ||
      session.family?.id !== profile.familyId ||
      body.kind !== profile.consentAction ||
      profile.consentStatus === 'confirmed' ||
      profile.consentStatus === 'withdrawn'
    )
      return false;
    sending.current = true;
    try {
      await mutation.mutateAsync(body);
      return true;
    } catch {
      return false;
    } finally {
      sending.current = false;
    }
  };
  return { submit, pending: mutation.isPending, error: mutation.error };
}
