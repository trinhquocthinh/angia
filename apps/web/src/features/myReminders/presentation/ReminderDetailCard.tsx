import type { MyReminder } from '@angia/contracts';
import { DoseConfirmationControl } from '@src/features/doseConfirmations/presentation/DoseConfirmationControl';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { describeReminderSchedule } from '../application/describeReminderSchedule';
import { reminderMedicationLine } from '../application/reminderMedicationLine';

// Thẻ nội dung lời nhắc: hồ sơ, buổi/ngày/giờ, danh sách thuốc và xác nhận cả buổi. Không nhận định (BR-033).
export function ReminderDetailCard({ reminder, session }: { reminder: MyReminder; session: ProfileSession }) {
  const schedule = describeReminderSchedule(reminder);
  return (
    <section
      aria-labelledby="reminder-profile"
      className="flex flex-col gap-4 rounded-[20px] bg-surface p-5 shadow-[0_1px_2px_color-mix(in_srgb,var(--color-shadow)_4%,transparent)] lg:p-6"
    >
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-wide text-accent uppercase">Hồ sơ</p>
        <h2 id="reminder-profile" className="text-lg font-semibold break-words text-text-primary">
          {reminder.profileName}
        </h2>
        <p className="text-sm text-text-secondary tabular-nums">
          {`${schedule.slot} · ${schedule.date} · ${schedule.time}`}
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {reminder.medications.map((medication, index) => (
          <li
            key={`${index}-${medication.name}`}
            className="rounded-xl bg-bg px-4 py-3 text-base leading-snug break-words text-text-primary"
          >
            {reminderMedicationLine(medication)}
          </li>
        ))}
      </ul>
      <DoseConfirmationControl reminder={reminder} session={session} />
    </section>
  );
}
