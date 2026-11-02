import { describeReminderSchedule } from '@src/features/myReminders/application/describeReminderSchedule';
import { reminderMedicationLine } from '@src/features/myReminders/application/reminderMedicationLine';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { useSelfQuery } from '../application/useSelfQuery';
import { SelfLoadError, SelfSkeleton } from './SelfLoadState';
import { selfProfileRepository as repository } from './selfProfileRepository';

// Danh sách chỉ đọc; xác nhận "Đã dùng" thêm ở E14-S4-T2 (SPEC-046).
export function SelfReminders({ session }: { session: ProfileSession }) {
  const reminders = useSelfQuery(session, 'reminders', (signal) => repository.reminders(signal));
  if (reminders.isError) return <SelfLoadError label="lời nhắc" retry={() => void reminders.refetch()} />;
  if (!reminders.data) return <SelfSkeleton label="lời nhắc" />;
  if (reminders.data.length === 0)
    return <p className="rounded-[20px] bg-white p-6 text-sm">Hôm nay không có lời nhắc.</p>;
  return (
    <ul className="grid items-start gap-4 md:grid-cols-2">
      {reminders.data.map((reminder) => {
        const { slot, time } = describeReminderSchedule(reminder);
        return (
          <li key={reminder.id} className="flex flex-col gap-2 rounded-xl bg-white p-5 shadow-sm">
            <p className="font-semibold text-[#004135]">
              {slot} · {time}
            </p>
            <ul className="flex flex-col gap-1 text-sm break-words text-[#404945]">
              {reminder.medications.map((medication, index) => (
                <li key={index}>{reminderMedicationLine(medication)}</li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
