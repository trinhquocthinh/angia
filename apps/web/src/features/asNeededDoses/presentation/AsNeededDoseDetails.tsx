import type { CurrentMedicationCourse } from '@angia/contracts';
import { formatDoseTime } from '../application/formatDoseTime';

export function AsNeededDoseDetails({ course }: { course: CurrentMedicationCourse }) {
  if (course.slots.length !== 1 || course.slots[0] !== 'as_needed') return null;
  return (
    <div className="flex flex-col gap-1 text-sm text-text-secondary">
      <p>{course.lastDoseAt ? `Liều trước: ${formatDoseTime(course.lastDoseAt)}` : 'Chưa ghi liều'}</p>
      {course.interval && (
        <p className="break-words">
          {course.interval.source === 'prescription'
            ? `Khoảng cách ghi trên đơn: ${course.interval.text}`
            : `Khoảng cách: ${course.interval.text} · Do người dùng nhập`}
        </p>
      )}
    </div>
  );
}
