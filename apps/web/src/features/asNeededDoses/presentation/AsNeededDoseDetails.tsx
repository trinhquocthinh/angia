import type { CurrentMedicationCourse } from '@angia/contracts';
import { formatDoseTime } from '../application/formatDoseTime';

export function AsNeededDoseDetails({ course }: { course: CurrentMedicationCourse }) {
  if (course.slots.length !== 1 || course.slots[0] !== 'as_needed') return null;
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border/30 bg-surface px-3 py-2 text-caption text-text-secondary">
      <p className="font-medium text-text-primary tabular-nums">
        {course.lastDoseAt ? `Liều trước: ${formatDoseTime(course.lastDoseAt)}` : 'Chưa ghi liều'}
      </p>
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
