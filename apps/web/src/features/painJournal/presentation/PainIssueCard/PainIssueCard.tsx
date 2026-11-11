import type { PainIssueSummary } from '@angia/contracts';
import { describeBodyLocation } from '../BodyMap2D/describeBodyLocation';
import type { PainJournalActions } from '../PainJournalTab/painJournalActions';

const recordedFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const buttonClass = 'min-h-11 rounded-xl bg-accent-soft px-4 text-sm font-medium text-accent';
type Props = Pick<PainJournalActions, 'onOpen' | 'onRecord'> & { issue: PainIssueSummary };

export function PainIssueCard({ issue, onOpen, onRecord }: Props) {
  const location = describeBodyLocation(issue);
  const parts = recordedFormatter.formatToParts(new Date(issue.lastEntry.recordedAt));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((value) => value.type === type)?.value;
  const recorded = `${part('day')}/${part('month')} · ${part('hour')}:${part('minute')}`;
  return (
    <article
      aria-label={location}
      className="flex min-w-0 flex-col gap-3 rounded-xl border border-border p-4"
    >
      <h3 className="break-words text-lg font-semibold text-text-primary">{location}</h3>
      {issue.title && <p className="break-words text-sm text-text-secondary">{issue.title}</p>}
      <p className="text-text-primary">
        <span className="text-4xl font-semibold tabular-nums">{issue.lastEntry.level}</span>
        <span className="text-sm text-text-secondary">/10</span>
      </p>
      <p className="text-sm text-text-secondary">
        <time dateTime={issue.lastEntry.recordedAt}>{recorded}</time> · {issue.entryCount} lần ghi
      </p>
      {issue.status === 'resolved' && issue.resolvedOn && (
        <p className="text-sm text-text-secondary">
          Khỏi từ {issue.resolvedOn.split('-').reverse().join('/')}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {onOpen && (
          <button
            type="button"
            className={buttonClass}
            onClick={() => onOpen(issue)}
            aria-label={`Xem vấn đề ${location}`}
          >
            Xem vấn đề
          </button>
        )}
        {issue.status === 'tracking' && onRecord && (
          <button
            type="button"
            className={buttonClass}
            onClick={() => onRecord(issue)}
            aria-label={`Ghi mức ${location}`}
          >
            Ghi mức
          </button>
        )}
      </div>
    </article>
  );
}
