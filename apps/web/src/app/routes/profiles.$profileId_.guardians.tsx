import { createFileRoute } from '@tanstack/react-router';
import { ProfileGuardiansPage } from '@src/features/profiles/presentation/guardians/ProfileGuardiansPage';

export const Route = createFileRoute('/profiles/$profileId_/guardians')({
  component: function GuardiansRoute() {
    const { profileId } = Route.useParams();
    return <ProfileGuardiansPage key={profileId} profileId={profileId} />;
  },
});
