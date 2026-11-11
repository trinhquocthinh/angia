import type { SelfReminder } from '@angia/contracts';
import { describeReminderSchedule } from '@src/features/myReminders/application/describeReminderSchedule';
import { reminderMedicationLine } from '@src/features/myReminders/application/reminderMedicationLine';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { Card } from '@src/shared/ui/card/Card';
import { TodayDoseControl } from './TodayDoseControl';

export function DoseSlotCard({ reminder, session }: { reminder: SelfReminder; session: ProfileSession }) {
  const schedule = describeReminderSchedule(reminder);
  return (
    <Card style={reminder.confirmation ? { backgroundColor: 'var(--color-accent-soft)' } : undefined}>
      <article className="flex flex-col gap-4 break-words" aria-label={`Buổi ${schedule.slot}`}>
        <header>
          <h2 className="text-[22px] leading-[30px] font-semibold">{schedule.slot}</h2>
          <p className="text-base leading-6 text-text-secondary tabular-nums">{schedule.time}</p>
        </header>
        <ul className="flex flex-col gap-2">
          {reminder.medications.map((medication, index) => (
            <li key={index}>{reminderMedicationLine(medication)}</li>
          ))}
        </ul>
        <TodayDoseControl reminder={reminder} session={session} />
      </article>
    </Card>
  );
}
