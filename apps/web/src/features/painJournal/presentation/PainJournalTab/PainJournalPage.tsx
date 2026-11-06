import { ProfileSectionPage } from '@src/features/profiles/presentation/components/ProfileSectionPage';
import { ProfileHealthHeader } from '@src/features/measurements/presentation/components/ProfileHealthHeader';
import { PainJournalWorkspace } from './PainJournalWorkspace';

export function PainJournalPage({ profileId }: { profileId: string }) {
  return (
    <ProfileSectionPage profileId={profileId}>
      {(profile, session) => (
        <div className="flex min-w-0 flex-col gap-6">
          <ProfileHealthHeader profile={profile} session={session} active="pain" />
          <PainJournalWorkspace
            key={`${session.account.id}:${session.family?.id}:${profile.id}`}
            profile={profile}
            session={session}
          />
        </div>
      )}
    </ProfileSectionPage>
  );
}
