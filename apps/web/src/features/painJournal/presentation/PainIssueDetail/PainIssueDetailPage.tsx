import { useNavigate } from '@tanstack/react-router';
import { ProfileSectionPage } from '@src/features/profiles/presentation/components/ProfileSectionPage';
import { ProfileHealthHeader } from '@src/features/measurements/presentation/components/ProfileHealthHeader';
import { PainIssueDetail } from './PainIssueDetail';

export function PainIssueDetailPage({ profileId, issueId }: { profileId: string; issueId: string }) {
  const navigate = useNavigate();
  return (
    <ProfileSectionPage profileId={profileId}>
      {(profile, session) => (
        <div className="flex min-w-0 flex-col gap-6">
          <ProfileHealthHeader profile={profile} session={session} active="pain" />
          <PainIssueDetail
            session={session}
            profile={profile}
            scope="main"
            issueId={issueId}
            onBack={() => {
              void navigate({ to: '/profiles/$profileId/pain', params: { profileId }, replace: true });
            }}
            onOpenIssue={(id) => {
              void navigate({ to: '/profiles/$profileId/pain/$issueId', params: { profileId, issueId: id } });
            }}
          />
        </div>
      )}
    </ProfileSectionPage>
  );
}
