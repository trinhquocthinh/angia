import { ProfileSectionPage } from '@src/features/profiles/presentation/components/ProfileSectionPage';
import { TimelineContent } from './TimelineContent';

export function TimelinePage({ profileId }: { profileId: string }) {
  return (
    <ProfileSectionPage profileId={profileId}>
      {(profile, session) => <TimelineContent key={profile.id} profile={profile} session={session} />}
    </ProfileSectionPage>
  );
}
