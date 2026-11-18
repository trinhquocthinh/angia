import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { CURRENT_SESSION_KEY, useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import { CreateHouseholdForm } from './CreateHouseholdForm';
import { StartChoices } from './StartChoices';
import { AcceptHouseholdInvitationForm } from '../invite/AcceptHouseholdInvitationForm';
import './household-start.css';

const profilesRepository = createProfilesRepository();

export function HouseholdStartPage({ create = false, join = false }: { create?: boolean; join?: boolean }) {
  const session = useCurrentSession(fetchCurrentSession);
  const client = useQueryClient();
  const navigate = useNavigate();
  const workspace = useProfilesWorkspace(profilesRepository, session.data);
  async function refresh() {
    await client.cancelQueries({ queryKey: CURRENT_SESSION_KEY });
    const current = await fetchCurrentSession();
    if (current && !current.family) throw new Error('Chưa cập nhật thông tin nhà.');
    client.setQueryData(CURRENT_SESSION_KEY, current);
    await navigate({ to: current ? '/' : '/login', replace: true });
  }
  if (!session.data || session.data.family) return null;
  return (
    <ProfileFrame session={session.data} profiles={[]} logout={workspace.logout}>
      <div className={`household-start${create ? ' household-start-creating' : ''}`}>
        {create ? (
          <CreateHouseholdForm token={session.data.csrfToken} refresh={refresh} />
        ) : join ? (
          <AcceptHouseholdInvitationForm csrfToken={session.data.csrfToken} refresh={refresh} />
        ) : (
          <StartChoices />
        )}
      </div>
    </ProfileFrame>
  );
}
