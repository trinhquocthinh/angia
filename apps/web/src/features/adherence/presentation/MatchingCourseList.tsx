import type { MedicationCourse } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';

// Đợt thuốc còn trong danh mục cùng tên với thuốc vừa ghi "Ngưng": tên, hàm lượng, khoảng hiệu lực.
export function MatchingCourseList({ courses }: { courses: MedicationCourse[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {courses.map((course) => (
        <li key={course.id}>
          <strong>
            {course.name}
            {course.strength ? ` ${course.strength}` : ''}
          </strong>{' '}
          · từ {formatDay(course.startDate)} ·{' '}
          {course.endDate ? `đến ${formatDay(course.endDate)}` : 'Dài hạn'}
        </li>
      ))}
    </ul>
  );
}
