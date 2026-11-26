import type { SelfReminder } from '@angia/contracts';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { SlotBadgeIcon } from '@src/features/medications/presentation/SlotBadgeIcon';
import { describeReminderSchedule } from '@src/features/myReminders/application/describeReminderSchedule';
import { reminderMedicationLine } from '@src/features/myReminders/application/reminderMedicationLine';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { DoseConfirmationControl } from './DoseConfirmationControl';

// Lời nhắc của ngày theo Stitch 8bafc41f / 1c851b03: lưới thẻ buổi Bento 3D, giàu icon, ít chữ (BR-033).
export function DayReminderList({
  reminders,
  session,
}: {
  reminders: SelfReminder[];
  session: ProfileSession;
}) {
  if (reminders.length === 0)
    return (
      <div className="profile-bento-card flex items-center gap-3 p-5 text-body text-text-secondary">
        <ProfileSectionIcon name="notifications" size={36} />
        <p>Hôm nay không có lời nhắc.</p>
      </div>
    );
  return (
    <ul className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
      {reminders.map((reminder) => {
        const { slot, time } = describeReminderSchedule(reminder);
        const done = Boolean(reminder.confirmation);
        return (
          <li
            key={reminder.id}
            className={`profile-bento-card flex flex-col gap-3.5 p-5 ${done ? 'border-secondary/40' : ''}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <SlotBadgeIcon slot={reminder.slot} />
                <p className="min-w-0 text-body font-semibold text-accent tabular-nums">
                  {slot} · {time}
                </p>
              </div>
              {done && (
                <span className="profile-consent-pill profile-consent-pill-confirmed">
                  <AdminIcon name="check" size={14} />
                  Đã dùng
                </span>
              )}
            </div>
            <ul className="flex flex-col gap-2">
              {reminder.medications.map((medication, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2.5 rounded-2xl bg-bg px-3 py-2.5 text-caption font-medium break-words text-text-primary"
                >
                  <ProfileSectionIcon name="medication" size={26} />
                  <span className="min-w-0 flex-1">{reminderMedicationLine(medication)}</span>
                </li>
              ))}
            </ul>
            <DoseConfirmationControl reminder={reminder} session={session} />
          </li>
        );
      })}
    </ul>
  );
}
