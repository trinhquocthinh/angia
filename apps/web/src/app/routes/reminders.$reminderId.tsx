import { createFileRoute } from '@tanstack/react-router';
import { ReminderDetailPage } from '@src/features/myReminders/presentation/ReminderDetailPage';
export const Route = createFileRoute('/reminders/$reminderId')({
  component: function ReminderRoute() {
    const { reminderId } = Route.useParams();
    return <ReminderDetailPage key={reminderId} reminderId={reminderId} />;
  },
});
