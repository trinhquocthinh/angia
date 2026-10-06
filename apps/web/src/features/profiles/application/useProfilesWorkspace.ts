import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProfileRequest, ProfilesRepository, ProfileSession } from './ports';
import { profileScopeKey } from './profileScopeKey';
export function useProfilesWorkspace(
  repository: ProfilesRepository,
  session: ProfileSession | null | undefined,
  loadAccounts = false,
) {
  const client = useQueryClient();
  const scope = profileScopeKey(session);
  const enabled = session?.role === 'main' && Boolean(session.family && session.csrfToken);
  const profiles = useQuery({
    queryKey: [...scope, 'list'],
    enabled,
    retry: false,
    queryFn: ({ signal }) => repository.list(signal),
  });
  const accounts = useQuery({
    queryKey: [...scope, 'linkable'],
    enabled: enabled && loadAccounts,
    retry: false,
    queryFn: ({ signal }) => repository.linkableAccounts(signal),
  });
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: scope }),
      client.invalidateQueries({ queryKey: ['current-session'] }),
    ]);
  };
  const create = useMutation({
    mutationFn: (body: ProfileRequest) => {
      if (!enabled) throw new Error('Chỉ người chăm sóc chính có thể tạo hồ sơ.');
      return repository.create(body, session!.csrfToken);
    },
    onSuccess: refresh,
  });
  const consent = useMutation({
    mutationFn: ({ id, confirmedBy }: { id: string; confirmedBy: 'self' | 'guardian' }) => {
      if (!enabled) throw new Error('Chỉ người chăm sóc chính có thể xác nhận đồng thuận.');
      return repository.confirm(id, confirmedBy, session!.csrfToken);
    },
    onSuccess: refresh,
  });
  const logout = useMutation({
    mutationFn: () => repository.logout(session?.csrfToken ?? ''),
    onSuccess: async () => {
      await client.cancelQueries();
      client.clear();
      window.location.assign('/login');
    },
  });
  return { profiles, accounts, create, consent, logout };
}
