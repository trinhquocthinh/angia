import { createFileRoute } from '@tanstack/react-router';
import { SelfProfilePage } from '@src/features/selfProfile/presentation/SelfProfilePage';

export const Route = createFileRoute('/my-profile_/pain/$issueId')({
  component: function SelfPainIssueRoute() {
    const { issueId } = Route.useParams();
    return <SelfProfilePage section="pain" issueId={issueId} />;
  },
});
