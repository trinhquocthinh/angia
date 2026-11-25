import type { PainIssueSummary } from '@angia/contracts';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
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
const cardClass = 'flex min-w-0 flex-col gap-3 rounded-[22px] border border-border/35 bg-bg p-4';
const levelClass = 'shrink-0 rounded-2xl bg-surface px-3 py-1 text-text-primary shadow-2xs';
const secondaryBtn =
  'inline-flex min-h-btn flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-surface px-3.5 text-button-secondary font-semibold text-accent shadow-2xs transition-colors hover:bg-accent-soft';
const primaryBtn =
  'inline-flex min-h-btn flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-accent px-3.5 text-button-primary font-semibold text-on-accent transition-colors hover:bg-accent-hover';

function formatRecorded(iso: string) {
  const parts = recordedFormatter.formatToParts(new Date(iso));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((value) => value.type === type)?.value;
  return `${part('day')}/${part('month')} · ${part('hour')}:${part('minute')}`;
}

type Props = Pick<PainJournalActions, 'onOpen' | 'onRecord'> & { issue: PainIssueSummary };

// Thẻ vấn đề đau chuẩn 3D Bento v2.0 (BR-063: số đo mức đau trung tính, không màu đánh giá).
export function PainIssueCard({ issue, onOpen, onRecord }: Props) {
  const location = describeBodyLocation(issue);
  const canRecord = issue.status === 'tracking' && onRecord;
  const resolved =
    issue.status === 'resolved' && issue.resolvedOn ? issue.resolvedOn.split('-').reverse().join('/') : null;
  return (
    <article aria-label={location} className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <ProfileSectionIcon name="accessibility_new" size={30} />
          <div className="min-w-0">
            <h3 className="break-words text-body font-semibold text-text-primary">{location}</h3>
            {issue.title && (
              <p className="mt-0.5 break-words text-caption text-text-secondary">{issue.title}</p>
            )}
          </div>
        </div>
        <p className={levelClass}>
          <span className="text-heading-2 font-bold tabular-nums">{issue.lastEntry.level}</span>
          <span className="text-caption text-text-secondary">/10</span>
        </p>
      </div>
      <p className="text-caption text-text-secondary tabular-nums">
        <time dateTime={issue.lastEntry.recordedAt}>{formatRecorded(issue.lastEntry.recordedAt)}</time> ·{' '}
        {issue.entryCount} lần ghi
      </p>
      {resolved && (
        <p className="text-caption font-medium text-text-secondary tabular-nums">Khỏi từ {resolved}</p>
      )}
      {(onOpen || canRecord) && (
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {onOpen && (
            <button
              type="button"
              className={secondaryBtn}
              onClick={() => onOpen(issue)}
              aria-label={`Xem vấn đề ${location}`}
            >
              <AdminIcon name="arrow_outward" size={16} />
              Xem vấn đề
            </button>
          )}
          {canRecord && (
            <button
              type="button"
              className={primaryBtn}
              onClick={() => onRecord(issue)}
              aria-label={`Ghi mức ${location}`}
            >
              <AdminIcon name="edit" size={16} />
              Ghi mức
            </button>
          )}
        </div>
      )}
    </article>
  );
}
