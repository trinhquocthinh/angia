import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import type { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { CURRENT_SESSION_KEY } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import { useHouseholdInvitationLink } from '../../application/useHouseholdInvitationLink';
import { inspectHouseholdInvitation } from '../../infrastructure/inspectHouseholdInvitation';
import { acceptHouseholdInvitation } from '../../infrastructure/acceptHouseholdInvitation';
import { HouseholdInvitationLinkContent } from './HouseholdInvitationLinkContent';
import '../start/household-start.css';

const repository = createProfilesRepository();
type Session = NonNullable<ReturnType<typeof useCurrentSession>['data']>;

export function SignedInHouseholdInvitation({ session }: { session: Session }) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const logout = useMutation({
    mutationFn: () => repository.logout(session.csrfToken),
    onSuccess: async () => {
      await client.cancelQueries();
      client.clear();
      window.location.assign('/login');
    },
  });
  async function refresh() {
    await client.cancelQueries({ queryKey: CURRENT_SESSION_KEY });
    const current = await fetchCurrentSession();
    if (current && !current.family) throw new Error('Chưa cập nhật thông tin nhà.');
    client.setQueryData(CURRENT_SESSION_KEY, current);
    await navigate({ to: current ? '/' : '/login', replace: true });
  }
  const model = useHouseholdInvitationLink({
    hasFamily: Boolean(session.family),
    csrfToken: session.csrfToken,
    inspect: inspectHouseholdInvitation,
    accept: acceptHouseholdInvitation,
    refresh,
    leave: () => navigate({ to: '/', replace: true }),
  });
  return (
    <ProfileFrame session={session} profiles={[]} logout={logout}>
      <div className={`household-start${model.phase === 'found_family' ? ' household-start-creating' : ''}`}>
        <HouseholdInvitationLinkContent model={model} csrfToken={session.csrfToken} refresh={refresh} />
      </div>
    </ProfileFrame>
  );
}
