import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  HealthProfile,
  ProfileListItem,
  ProfilesRepository,
  ProfileSession,
  UpdateProfileRequest,
} from './ports';
import { ProfileRequestError } from './ProfileRequestError';
import { profileScopeKey } from './profileScopeKey';
import { useProfileSessionRecovery } from './useProfileSessionRecovery';
export function useEditProfile(
  repository: ProfilesRepository,
  session: ProfileSession,
  profile: HealthProfile,
) {
  const client = useQueryClient();
  const sending = useRef(false);
  const scope = profileScopeKey(session);
  const refresh = () => client.invalidateQueries({ queryKey: scope });
  const mutation = useMutation({
    mutationFn: (body: UpdateProfileRequest) => repository.update(profile.id, body, session.csrfToken),
    onSuccess: async (updated) => {
      client.setQueryData<ProfileListItem[]>([...scope, 'list'], (items) =>
        items?.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
      );
      await Promise.all([
        refresh(),
        client.invalidateQueries({
          queryKey: ['visit-summary', session.account.id, session.family?.id, profile.id],
        }),
      ]);
    },
    onError: async (error) => {
      if (error instanceof ProfileRequestError && [404, 409].includes(error.status)) await refresh();
    },
  });
  useProfileSessionRecovery(mutation.error);
  const save = async (body: UpdateProfileRequest) => {
    if (
      sending.current ||
      session.role !== 'main' ||
      !session.csrfToken ||
      session.family?.id !== profile.familyId ||
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
  return { save, saving: mutation.isPending, error: mutation.error?.message ?? null };
}
