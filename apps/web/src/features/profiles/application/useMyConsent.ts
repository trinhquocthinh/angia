import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MyConsentRepository } from './myConsentPorts';
import type { ProfileSession } from './ports';
import { profileScopeKey } from './profileScopeKey';
function myConsentKey(session: ProfileSession | null | undefined) {
  return [...profileScopeKey(session), 'my-consent'] as const;
}
// SPEC-036: tài khoản liên kết đọc và rút đồng thuận; thành công thì làm mới đồng thuận và danh sách hồ sơ.
export function useMyConsent(repository: MyConsentRepository, session: ProfileSession | null | undefined) {
  const client = useQueryClient();
  const csrf = session?.csrfToken ?? '';
  const consent = useQuery({
    queryKey: myConsentKey(session),
    enabled: Boolean(session?.account.healthProfileId && csrf),
    retry: false,
    queryFn: ({ signal }) => repository.get(signal),
  });
  const withdraw = useMutation({
    mutationFn: () => repository.withdraw(csrf),
    onSuccess: () => client.invalidateQueries({ queryKey: profileScopeKey(session) }),
  });
  // SPEC-050: phiên đổi health_profile_id nên phải làm mới cả phiên.
  const unlink = useMutation({
    mutationFn: () => repository.unlink(csrf),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: profileScopeKey(session) }),
        client.invalidateQueries({ queryKey: ['current-session'] }),
      ]),
  });
  return { consent, withdraw, unlink };
}
