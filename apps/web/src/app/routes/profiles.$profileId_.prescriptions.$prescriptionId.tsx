import { createFileRoute } from '@tanstack/react-router';
import { PrescriptionsPage } from '@src/features/prescriptions/presentation/PrescriptionsPage';

export const Route = createFileRoute('/profiles/$profileId_/prescriptions/$prescriptionId')({
  component: function PrescriptionDetailRoute() {
    const { profileId, prescriptionId } = Route.useParams();
    return <PrescriptionsPage key={profileId} profileId={profileId} prescriptionId={prescriptionId} />;
  },
});
