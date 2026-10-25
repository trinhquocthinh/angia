import { createFileRoute } from '@tanstack/react-router';
import { ProfileHealthPage } from '@src/features/measurements/presentation/ProfileHealthPage';
export const Route = createFileRoute('/profiles/$profileId')({
  component: function ProfileHealthRoute() {
    const { profileId } = Route.useParams();
    return <ProfileHealthPage key={profileId} profileId={profileId} />;
  },
});
