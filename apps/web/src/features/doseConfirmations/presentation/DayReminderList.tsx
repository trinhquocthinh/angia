import type { SelfReminder } from '@angia/contracts';
import { describeReminderSchedule } from '@src/features/myReminders/application/describeReminderSchedule';
import { reminderMedicationLine } from '@src/features/myReminders/application/reminderMedicationLine';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { DoseConfirmationControl } from './DoseConfirmationControl';

// Lời nhắc của ngày, mỗi thẻ một buổi; `main` và tự xem thấy cùng bản xác nhận (Design §9.6).
export function DayReminderList({
  reminders,
  session,
}: {
  reminders: SelfReminder[];
  session: ProfileSession;
}) {
  if (reminders.length === 0)
    return <p className="rounded-[20px] bg-white p-6 text-sm">Hôm nay không có lời nhắc.</p>;
  return (
    <ul className="grid items-start gap-4 md:grid-cols-2">
      {reminders.map((reminder) => {
        const { slot, time } = describeReminderSchedule(reminder);
        return (
          <li key={reminder.id} className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-sm">
            <p className="font-semibold text-[#004135]">
              {slot} · {time}
            </p>
            <ul className="flex flex-col gap-1 text-sm break-words text-[#404945]">
              {reminder.medications.map((medication, index) => (
                <li key={index}>{reminderMedicationLine(medication)}</li>
              ))}
            </ul>
            <DoseConfirmationControl reminder={reminder} session={session} />
          </li>
        );
      })}
    </ul>
  );
}
