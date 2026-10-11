import { createFileRoute } from '@tanstack/react-router';
import { MedicationsPage } from '@src/features/medications/presentation/MedicationsPage';
export const Route = createFileRoute('/profiles/$profileId_/medications')({
  component: function MedicationsRoute() {
    const { profileId } = Route.useParams();
    return <MedicationsPage key={profileId} profileId={profileId} />;
  },
});
