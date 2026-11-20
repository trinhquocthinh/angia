import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProfileSession } from './ports';
import {
  guardianCandidatesQueryKey,
  profileGuardiansQueryKey,
  type ProfileGuardiansRepository,
} from './guardianPorts';
import { useGuardianMutation } from './useGuardianMutation';

export function useProfileGuardians(
  repository: ProfileGuardiansRepository,
  session: ProfileSession,
  profileId: string,
  enabled: boolean,
  loadCandidates = false,
) {
  const client = useQueryClient();
  const guardiansKey = profileGuardiansQueryKey(session, profileId);

  const guardiansQuery = useQuery({
    queryKey: guardiansKey,
    enabled,
    retry: false,
    queryFn: async ({ signal }) => {
      const result = await repository.list(profileId, signal);
      if (!result.ok) throw new Error('Chưa tải được danh sách người giám hộ.');
      return result.value;
    },
  });

  const candidatesQuery = useQuery({
    queryKey: guardianCandidatesQueryKey(session),
    enabled: enabled && loadCandidates,
    retry: false,
    queryFn: async ({ signal }) => {
      const result = await repository.listCandidates(signal);
      if (!result.ok) throw new Error('Chưa tải được danh sách thành viên.');
      return result.value;
    },
  });

  const mutation = useGuardianMutation(session.csrfToken, () =>
    client.invalidateQueries({ queryKey: guardiansKey }),
  );
  return {
    guardiansQuery,
    candidatesQuery,
    adding: mutation.pending,
    removing: mutation.pending,
    addGuardian: (id: string) => mutation.run(() => repository.add(profileId, id, session.csrfToken)),
    removeSelf: () => mutation.run(() => repository.removeSelf(profileId, session.csrfToken)),
  };
}
