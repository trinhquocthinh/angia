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
    <div className="flex flex-col gap-2">
      <label
        htmlFor="stop-course-select"
        className="text-xs font-bold tracking-wider text-[#55615f] uppercase"
      >
        Chọn đợt thuốc cần dừng <span className="text-[#b42318]">*</span>
      </label>
      <select
        id="stop-course-select"
        value={selectedId}
        disabled={pending}
        onChange={(event) => onSelect(event.target.value)}
        className="h-12 w-full cursor-pointer rounded-xl border border-[#d9e5e4] bg-white pl-3.5 text-sm font-medium text-[#131d1d] hover:border-[#9fb1ad] focus:border-[#004135] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#004135]/20 disabled:opacity-55"
      >
        <option value="">Chọn một đợt thuốc</option>
        {courses.map((course, index) => (
          <option key={course.id} value={course.id}>
            {course.name}
            {course.strength ? ` · ${course.strength}` : ''} · {course.quantityPerDose}{' '}
            {course.doseUnit ?? ''} · từ {course.startDate.split('-').reverse().join('/')} · đợt {index + 1}
          </option>
        ))}
      </select>
    </div>
  );
}
