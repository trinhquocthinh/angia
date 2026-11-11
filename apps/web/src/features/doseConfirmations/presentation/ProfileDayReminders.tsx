import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { SelfLoadError, SelfSkeleton } from '@src/features/selfProfile/presentation/SelfLoadState';
import { useProfileDayReminders } from '../application/useProfileDayReminders';
import { createDoseConfirmationRepository } from '../infrastructure/createDoseConfirmationRepository';
import { DayReminderList } from './DayReminderList';

const repository = createDoseConfirmationRepository();

// Khối cho `main` ở tab Thuốc: xem xác nhận của ngày và ghi thay khi API cho phép (SPEC-046).
export function ProfileDayReminders({
  profile,
  session,
}: {
  profile: HealthProfile;
  session: ProfileSession;
}) {
  const reminders = useProfileDayReminders(repository, session, profile);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-accent">Lời nhắc hôm nay</h2>
      {reminders.isError ? (
        <SelfLoadError label="lời nhắc" retry={() => void reminders.refetch()} />
      ) : reminders.data ? (
        <DayReminderList reminders={reminders.data} session={session} />
      ) : (
        <SelfSkeleton label="lời nhắc" />
      )}
    </section>
  );
}
