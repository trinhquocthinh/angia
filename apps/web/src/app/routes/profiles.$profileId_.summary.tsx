import { createFileRoute } from '@tanstack/react-router';
import { VisitSummaryPage } from '@src/features/visitSummary/presentation/VisitSummaryPage';
export const Route = createFileRoute('/profiles/$profileId_/summary')({
  component: function VisitSummaryRoute() {
    const { profileId } = Route.useParams();
    return <VisitSummaryPage key={profileId} profileId={profileId} />;
  },
});
