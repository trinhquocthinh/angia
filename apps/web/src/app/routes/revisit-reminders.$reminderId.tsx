import { createFileRoute } from '@tanstack/react-router';
import { RevisitReminderDetailPage } from '@src/features/myRevisitReminders/presentation/RevisitReminderDetailPage';
export const Route = createFileRoute('/revisit-reminders/$reminderId')({
  component: function RevisitReminderRoute() {
    const { reminderId } = Route.useParams();
    return <RevisitReminderDetailPage key={reminderId} reminderId={reminderId} />;
  },
});
