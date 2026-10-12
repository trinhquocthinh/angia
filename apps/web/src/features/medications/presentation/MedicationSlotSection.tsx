import type { MedicationSlotGroup } from '../application/groupMedicationsBySlot';
import { MedicationCard } from './MedicationCard';

export function MedicationSlotSection({ group, today }: { group: MedicationSlotGroup; today: string }) {
  const headingId = `medication-slot-${group.slot}`;
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 id={headingId} className="text-lg font-semibold text-[#004135]">
          {group.label}
        </h3>
        <span className="text-xs font-medium text-[#707975]">{group.courses.length} thuốc</span>
      </div>
      <ul className="flex flex-col gap-2">
        {group.courses.map((course) => (
          <li key={course.id}>
            <MedicationCard course={course} today={today} />
          </li>
        ))}
      </ul>
    </section>
  );
}
