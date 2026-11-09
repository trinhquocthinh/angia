import type { PainContext } from '@angia/contracts';
import { formatPainEntryTime } from '../PainIssueDetail/formatPainEntryTime';
export function PainMedicationText({ context }: { context: PainContext }) {
  const date = (day: string) => day.split('-').reverse().join('/');
  return (
    <div className="space-y-2 text-sm">
      <h3 className="font-semibold">Bối cảnh thuốc</h3>
      {context.asNeededDoses.length === 0 && context.courses.length === 0 && (
        <p>Chưa có bối cảnh thuốc trong khoảng này.</p>
      )}
      <ul className="space-y-2">
        {context.asNeededDoses.map((dose, i) => (
          <li className="break-words" key={`${dose.courseId}:${dose.givenAt}:${i}`}>
            Khi cần · {dose.name} · {formatPainEntryTime(dose.givenAt)}
            {dose.quantity !== null && ` · ${dose.quantity} ${dose.unit ?? ''}`}
          </li>
        ))}
        {context.courses.map((course) => (
          <li className="break-words" key={course.courseId}>
            Đợt thuốc · {course.name} · {date(course.startDate)} –{' '}
            {course.endDate ? date(course.endDate) : 'đến nay'}
          </li>
        ))}
      </ul>
    </div>
  );
}
