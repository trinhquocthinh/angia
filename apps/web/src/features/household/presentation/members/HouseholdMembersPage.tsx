import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import { useHouseholdMembers } from '../../application/useHouseholdMembers';
import { householdMembersRepository } from '../../infrastructure/householdMembersRepository';
import { HouseholdMembersCard } from './HouseholdMembersCard';
import './household-members.css';

const profilesRepository = createProfilesRepository();

export function HouseholdMembersPage() {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(profilesRepository, session.data);
  const hasFamily = Boolean(session.data?.family && session.data.role);
  const scope = session.data?.family ? `${session.data.account.id}:${session.data.family.id}` : 'none';
  const membersState = useHouseholdMembers(householdMembersRepository, scope, hasFamily);

  if (!session.data?.family || !session.data.role) return null;

  const errorMessage = membersState.query.isError
    ? membersState.query.error instanceof Error
      ? membersState.query.error.message
      : 'Chưa thể tải danh sách thành viên.'
    : null;

  return (
    <ProfileFrame
      session={session.data}
      profiles={workspace.profiles.data ?? []}
      logout={workspace.logout}
      mobileTitle="Thành viên trong nhà"
    >
      <HouseholdMembersCard
        familyName={session.data.family.name}
        viewerRole={session.data.role}
        members={membersState.query.data}
        isPending={membersState.query.isPending}
        errorMessage={errorMessage}
        onRetry={() => void membersState.query.refetch()}
      />
    </ProfileFrame>
  );
}
