import type { VisitSummary } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { describeBodyLocation } from '@src/features/painJournal/presentation/BodyMap2D/describeBodyLocation';
import { formatPainEntryTime } from '@src/features/painJournal/presentation/PainIssueDetail/formatPainEntryTime';

type PainIssue = VisitSummary['painIssues'][number];

// "Đau nhức & bài tập" (BR-064): chỉ con số, ngày và chữ người dùng nhập; mọi mức đau cùng một kiểu chữ (BR-063).
export function SummaryPain({ issues }: { issues: PainIssue[] }) {
  return (
    <section>
      <h3>Đau nhức &amp; bài tập</h3>
      {issues.length === 0 ? (
        <p className="summary-muted">Không có ghi nhận đau nhức trong khoảng này.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {issues.map((issue, index) => (
            <PainIssueItem key={index} issue={issue} />
          ))}
        </ul>
      )}
    </section>
  );
}

function PainIssueItem({ issue }: { issue: PainIssue }) {
  const status =
    issue.status === 'tracking' ? 'Đang theo dõi' : `Đã khỏi từ ${formatDay(issue.resolvedOn ?? '')}`;
  return (
    <li className="flex flex-col gap-0.5 break-inside-avoid">
      <span>
        <b className="font-semibold">{describeBodyLocation(issue)}</b>
        {issue.title && ` — ${issue.title}`} · {status}
      </span>
      {issue.entries.length === 0 ? (
        <span className="summary-muted">Không có lần ghi trong khoảng này.</span>
      ) : (
        issue.entries.map((entry, index) => (
          <span key={index} className="tabular-nums">
            {formatPainEntryTime(entry.recordedAt)} · <span>Mức {entry.level}/10</span>
            {entry.note && ` · ${entry.note}`} · Ghi bởi {entry.createdBy?.displayName ?? 'Tài khoản đã xóa'}
          </span>
        ))
      )}
      {issue.exercises.map((exercise, index) => (
        <span key={index}>
          Bài tập: {exercise.name} ·{' '}
          {exercise.source === 'self'
            ? 'Tự ghi'
            : `Bác sĩ chỉ định${exercise.prescriber ? ` · ${exercise.prescriber}` : ''}`}{' '}
          ·{' '}
          {exercise.endDate
            ? `${formatDay(exercise.startDate)} – ${formatDay(exercise.endDate)}`
            : `Từ ${formatDay(exercise.startDate)}`}
          {exercise.note && ` · ${exercise.note}`}
        </span>
      ))}
    </li>
  );
}
