import { ProfileSectionPage } from '@src/features/profiles/presentation/components/ProfileSectionPage';
import { RevisitsContent } from './RevisitsContent';

export function RevisitsPage({ profileId }: { profileId: string }) {
  return (
    <ProfileSectionPage profileId={profileId}>
      {(profile, session) => (
        <RevisitsContent
          key={`${session.account.id}:${session.family?.id}:${profile.id}`}
          profile={profile}
          session={session}
        />
      )}
    </ProfileSectionPage>
  );
}
