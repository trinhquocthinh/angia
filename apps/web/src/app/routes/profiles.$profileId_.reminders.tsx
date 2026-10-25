import { createFileRoute } from '@tanstack/react-router';
import { DoseSlotsPage } from '@src/features/reminders/presentation/DoseSlotsPage';
export const Route = createFileRoute('/profiles/$profileId_/reminders')({
  component: function RemindersRoute() {
    const { profileId } = Route.useParams();
    return <DoseSlotsPage key={profileId} profileId={profileId} />;
  },
});
