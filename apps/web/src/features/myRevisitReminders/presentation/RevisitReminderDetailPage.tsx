import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import { useMyRevisitReminder } from '../application/useMyRevisitReminder';
import { createMyRevisitReminderRepository } from '../infrastructure/createMyRevisitReminderRepository';
import { RevisitReminderDetailCard } from './RevisitReminderDetailCard';

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
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6">
        <h1 className="auth-heading text-2xl font-semibold text-[#131d1d]">Lời nhắc tái khám</h1>
        {reminder.error ? (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-[20px] bg-white p-6 text-sm">
            <p>
              {hidden
                ? 'Không tìm thấy lời nhắc hoặc bạn không có quyền xem.'
                : 'Không thể tải lời nhắc. Vui lòng thử lại.'}
            </p>
            {!hidden && (
              <button
                type="button"
                onClick={() => void reminder.refetch()}
                className="min-h-11 rounded-full bg-[#004135] px-5 font-semibold text-white"
              >
                Thử lại
              </button>
            )}
          </div>
        ) : reminder.data ? (
          <RevisitReminderDetailCard reminder={reminder.data} />
        ) : (
          <p role="status" className="rounded-[20px] bg-white p-6 text-sm">
            Đang tải lời nhắc…
          </p>
        )}
      </div>
    </ProfileFrame>
  );
}
