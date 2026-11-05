import { DayReminderList } from '@src/features/doseConfirmations/presentation/DayReminderList';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { useSelfQuery } from '../application/useSelfQuery';
import { SelfLoadError, SelfSkeleton } from './SelfLoadState';
import { selfProfileRepository as repository } from './selfProfileRepository';

// Mọi dữ liệu tự xem chỉ đọc; "Đã dùng"/hủy là ngoại lệ riêng (SPEC-046).
export function SelfReminders({ session }: { session: ProfileSession }) {
  const reminders = useSelfQuery(session, 'reminders', (signal) => repository.reminders(signal));
  if (reminders.isError) return <SelfLoadError label="lời nhắc" retry={() => void reminders.refetch()} />;
  if (!reminders.data) return <SelfSkeleton label="lời nhắc" />;
  return <DayReminderList reminders={reminders.data} session={session} />;
}
