import { createFileRoute } from '@tanstack/react-router';
import { PainIssueDetailPage } from '@src/features/painJournal/presentation/PainIssueDetail/PainIssueDetailPage';

export const Route = createFileRoute('/profiles/$profileId_/pain_/$issueId')({
  component: function PainIssueDetailRoute() {
    const { profileId, issueId } = Route.useParams();
    return <PainIssueDetailPage key={`${profileId}:${issueId}`} profileId={profileId} issueId={issueId} />;
  },
});
