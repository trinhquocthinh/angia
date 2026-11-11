import type { CurrentMedicationCourse } from '@angia/contracts';
import type { ReactNode } from 'react';
import { AsNeededDoseDetails } from '@src/features/asNeededDoses/presentation/AsNeededDoseDetails';
import { medicationSourceLabel } from '../application/medicationSourceLabel';
import { remainingDaysLabel } from '../application/remainingDaysLabel';
import { doseLabel } from '../application/doseLabel';

// Thẻ thuốc trong một buổi: tên + hàm lượng, liều mỗi lần, thời hạn ("Còn N ngày"/"Dài hạn"), nguồn gốc.
// Chỉ mô tả dữ liệu đã lưu, không nhận định (BR-033).
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
  return (
    <article className="flex flex-col gap-2 rounded-xl bg-bg p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="min-w-0 text-base leading-snug font-semibold text-text-primary">
          {course.name}
          {course.strength && (
            <span className="ml-2 rounded bg-border px-1.5 py-0.5 align-middle text-xs font-medium text-text-secondary">
              {course.strength}
            </span>
          )}
        </h4>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${longTerm ? 'bg-accent-soft text-text-secondary' : 'bg-accent-soft text-accent'}`}
        >
          {remainingDaysLabel(course.endDate, today)}
        </span>
      </div>
      <p className="text-sm text-text-secondary">{doseLabel(course.quantityPerDose, course.doseUnit)}</p>
      <p className="text-xs text-text-secondary">{medicationSourceLabel(course)}</p>
      <AsNeededDoseDetails course={course} />
      {actions}
    </article>
  );
}
