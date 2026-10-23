import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import { useMyReminder } from '../application/useMyReminder';
import { createMyReminderRepository } from '../infrastructure/createMyReminderRepository';
import { ReminderDetailCard } from './ReminderDetailCard';

const profilesRepository = createProfilesRepository();
const reminders = createMyReminderRepository();
const notice = 'rounded-[20px] bg-white p-6 text-sm text-[#404945]';

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
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6">
        <h1 className="auth-heading text-2xl font-semibold tracking-tight text-[#131d1d]">
          Lời nhắc dùng thuốc
        </h1>
        {reminder.data ? (
          <ReminderDetailCard reminder={reminder.data} />
        ) : hidden ? (
          <p role="alert" className={notice}>
            Không tìm thấy lời nhắc hoặc bạn không có quyền xem.
          </p>
        ) : error ? (
          <div role="alert" className={`${notice} flex flex-col items-start gap-3`}>
            <p>Không thể tải lời nhắc. Vui lòng thử lại.</p>
            <button
              type="button"
              onClick={() => void reminder.refetch()}
              className="min-h-11 rounded-full bg-[#004135] px-5 text-sm font-semibold text-white"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <p className={notice}>Đang tải lời nhắc…</p>
        )}
      </div>
    </ProfileFrame>
  );
}
