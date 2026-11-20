import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import { HouseholdHomeCard } from './HouseholdHomeCard';
import { useHouseholdHomeController } from './useHouseholdHomeController';
import './household-home.css';

const profilesRepository = createProfilesRepository();

export function HouseholdHomePage() {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(profilesRepository, session.data);
  const hasFamily = Boolean(session.data?.family && session.data.role);
  const scope = session.data?.family ? `${session.data.account.id}:${session.data.family.id}` : 'none';
  const cardProps = useHouseholdHomeController({
    familyName: session.data?.family?.name ?? '',
    scope,
    hasFamily,
    csrfToken: session.data?.csrfToken ?? '',
  });

  if (!session.data?.family || !session.data.role) return null;

  return (
    <ProfileFrame
      session={session.data}
      profiles={workspace.profiles.data ?? []}
      logout={workspace.logout}
      mobileTitle="Nhà của tôi"
    >
      <HouseholdHomeCard {...cardProps} />
    </ProfileFrame>
  );
}
