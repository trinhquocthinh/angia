import { createFileRoute } from '@tanstack/react-router';
import { LabResultsPage } from '@src/features/labResults/presentation/LabResultsPage';
export const Route = createFileRoute('/profiles/$profileId_/lab-results')({
  component: function LabResultsRoute() {
    const { profileId } = Route.useParams();
    return <LabResultsPage key={profileId} profileId={profileId} />;
  },
});
