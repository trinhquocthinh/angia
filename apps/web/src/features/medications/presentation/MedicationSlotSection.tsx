import type { MedicationSlotGroup } from '../application/groupMedicationsBySlot';
import type { CurrentMedicationCourse } from '@angia/contracts';
import type { ReactNode } from 'react';
import { MedicationCard } from './MedicationCard';
import { SlotBadgeIcon } from './SlotBadgeIcon';

export function MedicationSlotSection({
  group,
  today,
  renderCourseActions,
}: {
  group: MedicationSlotGroup;
  today: string;
  renderCourseActions?: ((course: CurrentMedicationCourse) => ReactNode) | undefined;
}) {
  const headingId = `medication-slot-${group.slot}`;
  return (
    <section aria-labelledby={headingId} className="profile-bento-card flex flex-col gap-3.5 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <SlotBadgeIcon slot={group.slot} />
          <h3 id={headingId} className="text-heading-2 font-semibold text-accent">
            {group.label}
          </h3>
        </div>
        <span className="rounded-full bg-accent-soft px-3 py-0.5 text-caption font-semibold text-accent tabular-nums">
          {group.courses.length} thuốc
        </span>
      </div>
      <ul className="flex flex-col gap-2.5">
        {group.courses.map((course) => (
          <li key={course.id}>
            <MedicationCard course={course} today={today} actions={renderCourseActions?.(course)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
