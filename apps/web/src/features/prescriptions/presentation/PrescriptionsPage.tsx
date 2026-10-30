import { ProfileSectionPage } from '@src/features/profiles/presentation/components/ProfileSectionPage';
import { PrescriptionsContent } from './PrescriptionsContent';

export function PrescriptionsPage({
  profileId,
  prescriptionId,
}: {
  profileId: string;
  prescriptionId?: string | undefined;
}) {
  return (
    <ProfileSectionPage profileId={profileId}>
      {(profile, session) => (
        <PrescriptionsContent
          key={`${session.account.id}:${session.family?.id}:${profile.id}`}
          profile={profile}
          session={session}
          prescriptionId={prescriptionId}
        />
      )}
    </ProfileSectionPage>
  );
}
