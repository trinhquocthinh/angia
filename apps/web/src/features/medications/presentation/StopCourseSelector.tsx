import type { MedicationCourse } from '@angia/contracts';
import { doseLabel } from '../application/doseLabel';
export function StopCourseSelector({
  courses,
  selectedId,
  pending,
  onSelect,
}: {
  courses: MedicationCourse[];
  selectedId: string;
  pending: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="stop-course-select"
        className="text-xs font-bold tracking-wider text-text-secondary uppercase"
      >
        Chọn đợt thuốc cần dừng <span className="text-danger">*</span>
      </label>
      <select
        id="stop-course-select"
        value={selectedId}
        disabled={pending}
        onChange={(event) => onSelect(event.target.value)}
        className="h-12 w-full cursor-pointer rounded-xl border border-border bg-surface pl-3.5 text-sm font-medium text-text-primary hover:border-text-secondary focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/20 disabled:opacity-55"
      >
        <option value="">Chọn một đợt thuốc</option>
        {courses.map((course, index) => (
          <option key={course.id} value={course.id}>
            {course.name}
            {course.strength ? ` · ${course.strength}` : ''} ·{' '}
            {doseLabel(course.quantityPerDose, course.doseUnit)} · từ{' '}
            {course.startDate.split('-').reverse().join('/')} · đợt {index + 1}
          </option>
        ))}
      </select>
    </div>
  );
}
