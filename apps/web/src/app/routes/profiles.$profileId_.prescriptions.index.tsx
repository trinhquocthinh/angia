import { createFileRoute } from '@tanstack/react-router';
import { PrescriptionsPage } from '@src/features/prescriptions/presentation/PrescriptionsPage';

export const Route = createFileRoute('/profiles/$profileId_/prescriptions/')({
  component: function PrescriptionsRoute() {
    const { profileId } = Route.useParams();
    return <PrescriptionsPage key={profileId} profileId={profileId} />;
  },
});
