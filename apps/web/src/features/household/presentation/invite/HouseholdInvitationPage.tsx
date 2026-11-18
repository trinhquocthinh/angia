import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import { HouseholdInvitationForm } from './HouseholdInvitationForm';
import './household-invite.css';

const profilesRepository = createProfilesRepository();
export function HouseholdInvitationPage() {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(profilesRepository, session.data);
  if (!session.data?.family) return null;
  return (
    <ProfileFrame
      session={session.data}
      profiles={workspace.profiles.data ?? []}
      logout={workspace.logout}
      mobileTitle="Mời người thân"
    >
      {session.data.role === 'main' ? (
        <HouseholdInvitationForm
          key={`${session.data.account.id}:${session.data.family.id}`}
          scope={`${session.data.account.id}:${session.data.family.id}`}
          csrfToken={session.data.csrfToken}
        />
      ) : (
        <p role="alert">Chỉ Chủ hộ hoặc Đồng quản lý có thể tạo lời mời.</p>
      )}
    </ProfileFrame>
  );
}
