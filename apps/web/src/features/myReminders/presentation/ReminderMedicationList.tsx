import type { MyReminder } from '@angia/contracts';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { reminderMedicationLine } from '../application/reminderMedicationLine';

export function ReminderMedicationList({ medications }: { medications: MyReminder['medications'] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-caption font-semibold text-accent">Thuốc trong buổi</h3>
        <span className="reminder-pill reminder-pill-muted tabular-nums">{medications.length} thuốc</span>
      </div>
      <ul aria-label="Thuốc trong buổi" className="flex flex-col gap-2.5">
        {medications.map((medication, index) => (
          <li key={`${index}-${medication.name}`} className="reminder-item-tile">
            <span className="reminder-section-tile" aria-hidden="true">
              <ProfileSectionIcon name="medication" size={30} />
            </span>
            <span className="min-w-0 flex-1 text-body font-medium text-text-primary">
              {reminderMedicationLine(medication)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
