import type { MedicationCourse } from '@angia/contracts';
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
    <label className="flex flex-col gap-2">
      Chọn đợt thuốc
      <select
        value={selectedId}
        disabled={pending}
        onChange={(event) => onSelect(event.target.value)}
        className="min-h-11 rounded-xl border border-[#cbd7d2] px-3"
      >
        <option value="">Chọn một đợt thuốc</option>
        {courses.map((course, index) => (
          <option key={course.id} value={course.id}>
            {course.name}
            {course.strength ? ` · ${course.strength}` : ''} · {course.quantityPerDose}{' '}
            {course.doseUnit ?? ''} · từ {course.startDate} · đợt {index + 1}
          </option>
        ))}
      </select>
    </label>
  );
}
