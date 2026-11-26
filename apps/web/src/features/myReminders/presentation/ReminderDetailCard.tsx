import type { MyReminder } from '@angia/contracts';
import { DoseConfirmationControl } from '@src/features/doseConfirmations/presentation/DoseConfirmationControl';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { SlotBadgeIcon } from '@src/features/medications/presentation/SlotBadgeIcon';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { describeReminderSchedule } from '../application/describeReminderSchedule';
import { ReminderMedicationList } from './ReminderMedicationList';

// Thẻ nội dung lời nhắc theo Warm Clay Bento: hồ sơ, buổi/ngày/giờ, thuốc trong buổi và xác nhận cả buổi (BR-033).
export function ReminderDetailCard({ reminder, session }: { reminder: MyReminder; session: ProfileSession }) {
  const schedule = describeReminderSchedule(reminder);
  const done = Boolean(reminder.confirmation);
  return (
    <section
      aria-labelledby="reminder-profile"
      className={`reminder-card flex flex-col gap-6 p-5 md:p-7 ${done ? 'reminder-card-confirmed' : ''}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="reminder-ceramic-avatar" aria-hidden="true">
            {reminder.profileName.slice(0, 1)}
            {done && (
              <span className="reminder-ceramic-badge">
                <AdminIcon name="check" size={13} />
              </span>
            )}
          </span>
          <div className="min-w-0">
            <p className="text-caption font-semibold text-text-secondary">Lời nhắc của</p>
            <h2
              id="reminder-profile"
              className="auth-heading text-heading-2 font-semibold break-words text-text-primary"
            >
              {reminder.profileName}
            </h2>
          </div>
        </div>
        {done && (
          <span className="reminder-pill reminder-pill-confirmed">
            <AdminIcon name="check_circle" size={16} />
            Đã dùng
          </span>
        )}
      </div>
      <div className="reminder-schedule-strip">
        <div className="flex min-w-0 items-center gap-3">
          <SlotBadgeIcon slot={reminder.slot} />
          <div className="min-w-0">
            <p className="text-body font-semibold text-text-primary">{schedule.slot}</p>
            <p className="text-caption text-text-secondary tabular-nums">{schedule.date}</p>
          </div>
        </div>
        <p className="auth-heading text-heading-1 font-semibold text-accent tabular-nums">{schedule.time}</p>
      </div>
      <ReminderMedicationList medications={reminder.medications} />
      <DoseConfirmationControl reminder={reminder} session={session} />
    </section>
  );
}
