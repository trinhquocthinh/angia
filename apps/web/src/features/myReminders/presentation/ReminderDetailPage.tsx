import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import { ReminderDetailHeading } from '@src/features/reminders/presentation/ReminderDetailHeading';
import { ReminderDetailState } from '@src/features/reminders/presentation/ReminderDetailState';
import { useMyReminder } from '../application/useMyReminder';
import { createMyReminderRepository } from '../infrastructure/createMyReminderRepository';
import { ReminderDetailCard } from './ReminderDetailCard';
import '@src/shared/styles/reminders.css';

const profilesRepository = createProfilesRepository();
const reminders = createMyReminderRepository();

// Trang /reminders/:id (SPEC-035) cho người nhận nhắc — cả main và member đã có gia đình.
// 404/403 → thông điệp chung, không phân biệt "không tồn tại" và "không có quyền".
export function ReminderDetailPage({ reminderId }: { reminderId: string }) {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(profilesRepository, session.data);
  const reminder = useMyReminder(reminders, reminderId, Boolean(session.data?.family));
  if (!session.data) return null;
  const error = reminder.error;
  const hidden = error instanceof MedicationRequestError && error.status < 500;
  return (
    <ProfileFrame
      session={session.data}
      profiles={session.data.role === 'main' ? (workspace.profiles.data ?? []) : []}
      logout={workspace.logout}
      mobileTitle="Lời nhắc dùng thuốc"
    >
      <div className="mx-auto flex w-full max-w-[680px] flex-col gap-5 pb-6">
        <ReminderDetailHeading
          title="Lời nhắc dùng thuốc"
          subtitle="Danh sách thuốc theo khung giờ đã thiết lập"
        />
        {reminder.data ? (
          <ReminderDetailCard reminder={reminder.data} session={session.data} />
        ) : hidden ? (
          <ReminderDetailState kind="hidden" />
        ) : error ? (
          <ReminderDetailState kind="error" onRetry={() => void reminder.refetch()} />
        ) : (
          <ReminderDetailState kind="loading" />
        )}
      </div>
    </ProfileFrame>
  );
}
