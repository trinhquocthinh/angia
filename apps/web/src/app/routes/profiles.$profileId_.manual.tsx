import { createFileRoute } from '@tanstack/react-router';
import { ManualRecordPage } from '@src/features/documents/presentation/ManualRecordPage';
export const Route = createFileRoute('/profiles/$profileId_/manual')({
  component: function ManualRecordRoute() {
    const { profileId } = Route.useParams();
    return <ManualRecordPage key={profileId} profileId={profileId} />;
  },
});
