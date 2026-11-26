import type { CurrentMedicationCourse } from '@angia/contracts';
import type { ReactNode } from 'react';
import { AsNeededDoseDetails } from '@src/features/asNeededDoses/presentation/AsNeededDoseDetails';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { medicationSourceLabel } from '../application/medicationSourceLabel';
import { remainingDaysLabel } from '../application/remainingDaysLabel';
import { doseLabel } from '../application/doseLabel';

// Thẻ thuốc theo Stitch 8bafc41f / 1c851b03: icon 3D đất sét, liều dạng pill gọn, giữ trung lập (BR-033).
export function MedicationCard({
  course,
  today,
  actions,
}: {
  course: CurrentMedicationCourse;
  today: string;
  actions?: ReactNode;
}) {
  const longTerm = course.endDate === null;
  const dose = doseLabel(course.quantityPerDose, course.doseUnit);
  return (
    <article className="flex flex-col gap-2.5 rounded-2xl border border-border/35 bg-bg p-4">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface shadow-2xs">
            <ProfileSectionIcon name="medication" size={28} />
          </span>
          <div className="min-w-0">
            <h4 className="flex flex-wrap items-center gap-1.5 text-body font-semibold text-text-primary">
              <span>{course.name}</span>
              {course.strength && (
                <span className="rounded-lg border border-border/30 bg-surface px-2 py-0.5 text-caption font-semibold text-accent">
                  {course.strength}
                </span>
              )}
            </h4>
            <p className="mt-0.5 text-caption text-text-secondary">{medicationSourceLabel(course)}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-xl border border-border/30 bg-surface px-2.5 py-1 text-caption font-semibold text-accent tabular-nums">
          {dose}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`rounded-full px-3 py-0.5 text-caption font-semibold tabular-nums ${longTerm ? 'bg-surface-container text-text-secondary' : 'bg-secondary-container text-on-secondary-container'}`}
        >
          {remainingDaysLabel(course.endDate, today)}
        </span>
      </div>
      <AsNeededDoseDetails course={course} />
      {actions}
    </article>
  );
}
