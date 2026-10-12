import type { CurrentMedicationCourse } from '@angia/contracts';
import { medicationSourceLabel } from '../application/medicationSourceLabel';
import { remainingDaysLabel } from '../application/remainingDaysLabel';
import { doseLabel } from '../application/doseLabel';

// Thẻ thuốc trong một buổi: tên + hàm lượng, liều mỗi lần, thời hạn ("Còn N ngày"/"Dài hạn"), nguồn gốc.
// Chỉ mô tả dữ liệu đã lưu, không nhận định (BR-033).
export function MedicationCard({ course, today }: { course: CurrentMedicationCourse; today: string }) {
  const longTerm = course.endDate === null;
  return (
    <article className="flex flex-col gap-2 rounded-xl bg-[#f6fbfa] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="min-w-0 text-base leading-snug font-semibold text-[#131d1d]">
          {course.name}
          {course.strength && (
            <span className="ml-2 rounded bg-[#deebea] px-1.5 py-0.5 align-middle text-xs font-medium text-[#404945]">
              {course.strength}
            </span>
          )}
        </h4>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${longTerm ? 'bg-[#e4f0f0] text-[#404945]' : 'bg-[#aef0da] text-[#2f6f5e]'}`}
        >
          {remainingDaysLabel(course.endDate, today)}
        </span>
      </div>
      <p className="text-sm text-[#404945]">{doseLabel(course.quantityPerDose, course.doseUnit)}</p>
      <p className="text-xs text-[#707975]">{medicationSourceLabel(course)}</p>
    </article>
  );
}
