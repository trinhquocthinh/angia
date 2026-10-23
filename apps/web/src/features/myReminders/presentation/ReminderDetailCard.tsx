import type { MyReminder } from '@angia/contracts';
import { describeReminderSchedule } from '../application/describeReminderSchedule';
import { reminderMedicationLine } from '../application/reminderMedicationLine';

// Thẻ nội dung lời nhắc: hồ sơ, buổi/ngày/giờ và danh sách thuốc. Không nút xác nhận, không nhận định (BR-033).
export function ReminderDetailCard({ reminder }: { reminder: MyReminder }) {
  const schedule = describeReminderSchedule(reminder);
  return (
    <section
      aria-labelledby="reminder-profile"
      className="flex flex-col gap-4 rounded-[20px] bg-white p-5 shadow-[0_1px_2px_rgba(19,29,29,0.04)] lg:p-6"
    >
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-wide text-[#286958] uppercase">Hồ sơ</p>
        <h2 id="reminder-profile" className="text-lg font-semibold break-words text-[#131d1d]">
          {reminder.profileName}
        </h2>
        <p className="text-sm text-[#404945] tabular-nums">
          {`${schedule.slot} · ${schedule.date} · ${schedule.time}`}
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {reminder.medications.map((medication, index) => (
          <li
            key={`${index}-${medication.name}`}
            className="rounded-xl bg-[#f6fbfa] px-4 py-3 text-base leading-snug break-words text-[#131d1d]"
          >
            {reminderMedicationLine(medication)}
          </li>
        ))}
      </ul>
    </section>
  );
}
