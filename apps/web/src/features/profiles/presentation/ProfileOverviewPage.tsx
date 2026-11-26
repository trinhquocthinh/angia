import { ProfileSectionPage } from './components/ProfileSectionPage';
import { ProfileOverview } from './components/ProfileOverview';

export function ProfileOverviewPage({ profileId }: { profileId: string }) {
  return (
    <ProfileSectionPage profileId={profileId}>
      {(profile, session) => <ProfileOverview key={profile.id} profile={profile} session={session} />}
    </ProfileSectionPage>
  );
}
