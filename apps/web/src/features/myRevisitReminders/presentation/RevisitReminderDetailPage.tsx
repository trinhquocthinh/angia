import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import { ReminderDetailHeading } from '@src/features/reminders/presentation/ReminderDetailHeading';
import { ReminderDetailState } from '@src/features/reminders/presentation/ReminderDetailState';
import { useMyRevisitReminder } from '../application/useMyRevisitReminder';
import { createMyRevisitReminderRepository } from '../infrastructure/createMyRevisitReminderRepository';
import { RevisitReminderDetailCard } from './RevisitReminderDetailCard';
import '@src/shared/styles/reminders.css';

const profiles = createProfilesRepository();
const repository = createMyRevisitReminderRepository();

export function RevisitReminderDetailPage({ reminderId }: { reminderId: string }) {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(profiles, session.data);
  const reminder = useMyRevisitReminder(repository, reminderId, session.data);
  if (!session.data) return null;
  const hidden = reminder.error instanceof MedicationRequestError && reminder.error.status < 500;
  return (
    <ProfileFrame
      session={session.data}
      profiles={session.data.role === 'main' ? (workspace.profiles.data ?? []) : []}
      logout={workspace.logout}
      mobileTitle="Lời nhắc tái khám"
    >
      <div className="mx-auto flex w-full max-w-[680px] flex-col gap-5 pb-6">
        <ReminderDetailHeading
          title="Lời nhắc tái khám"
          subtitle="Thông tin ngày hẹn và các đơn thuốc liên quan"
          revisit
        />
        {reminder.error ? (
          hidden ? (
            <ReminderDetailState kind="hidden" />
          ) : (
            <ReminderDetailState kind="error" onRetry={() => void reminder.refetch()} />
          )
        ) : reminder.data ? (
          <RevisitReminderDetailCard reminder={reminder.data} />
        ) : (
          <ReminderDetailState kind="loading" />
        )}
      </div>
    </ProfileFrame>
  );
}
