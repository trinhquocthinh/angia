import { createFileRoute } from '@tanstack/react-router';
import { RevisitsPage } from '@src/features/revisits/presentation/RevisitsPage';
export const Route = createFileRoute('/profiles/$profileId_/revisits')({
  component: function RevisitsRoute() {
    const { profileId } = Route.useParams();
    return <RevisitsPage key={profileId} profileId={profileId} />;
  },
});
