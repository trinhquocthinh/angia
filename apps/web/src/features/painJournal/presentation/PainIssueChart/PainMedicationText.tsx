import type { PainContext } from '@angia/contracts';
import { formatPainEntryTime } from '../PainIssueDetail/formatPainEntryTime';
export function PainMedicationText({ context }: { context: PainContext }) {
  const date = (day: string) => day.split('-').reverse().join('/');
  return (
    <div className="space-y-2.5 border-t border-border/30 pt-4 text-caption">
      <h3 className="font-semibold text-text-primary">Bối cảnh thuốc</h3>
      {context.asNeededDoses.length === 0 && context.courses.length === 0 && (
        <p className="text-text-secondary">Chưa có bối cảnh thuốc trong khoảng này.</p>
      )}
      <ul className="flex flex-wrap gap-2">
        {context.asNeededDoses.map((dose, i) => (
          <li
            className="rounded-2xl border border-border/35 bg-bg px-3.5 py-2 break-words text-text-primary"
            key={`${dose.courseId}:${dose.givenAt}:${i}`}
          >
            Khi cần · {dose.name} · {formatPainEntryTime(dose.givenAt)}
            {dose.quantity !== null && ` · ${dose.quantity} ${dose.unit ?? ''}`}
          </li>
        ))}
        {context.courses.map((course) => (
          <li
            className="rounded-2xl border border-border/35 bg-bg px-3.5 py-2 break-words text-text-primary"
            key={course.courseId}
          >
            Đợt thuốc · {course.name} · {date(course.startDate)} –{' '}
            {course.endDate ? date(course.endDate) : 'đến nay'}
          </li>
        ))}
      </ul>
    </div>
  );
}
