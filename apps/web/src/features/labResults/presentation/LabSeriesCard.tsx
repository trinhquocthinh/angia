import type { LabSeries } from '@angia/contracts';
import { labResultRows } from '../application/labResultRows';
import { LabRangeFlag } from './LabRangeFlag';

type Props = { series: LabSeries; headingId: string; note: string | null };

// Thẻ chỉ số xét nghiệm chuẩn 3D Bento v2.0 (BR-022, BR-033).
export function LabSeriesCard({ series, headingId, note }: Props) {
  const noteId = `${headingId}-note`;
  const rows = labResultRows(series.results);
  return (
    <section
      aria-labelledby={headingId}
      aria-describedby={note ? noteId : undefined}
      className="profile-bento-card flex flex-col gap-3 p-5"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h3 id={headingId} className="min-w-0 text-heading-2 font-semibold break-words text-accent">
            {series.testName}
          </h3>
          <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 text-caption font-semibold text-accent tabular-nums">
            {rows.length} lần
          </span>
        </div>
        {note && (
          <p id={noteId} className="text-caption text-text-secondary">
            {note}
          </p>
        )}
      </div>
      <ol className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-1 rounded-2xl bg-bg p-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="rounded-lg bg-surface px-2 py-0.5 text-caption font-semibold text-text-secondary tabular-nums">
                {row.date}
              </span>
              <span className="min-w-0 text-right break-words">
                <span
                  className={`text-heading-2 font-bold tabular-nums ${row.rangeFlag ? 'text-warning' : 'text-text-primary'}`}
                >
                  {row.value}
                </span>
                {row.unit && <span className="ml-1 text-caption text-text-secondary">{row.unit}</span>}
              </span>
            </div>
            {row.rangeFlag && <LabRangeFlag flag={row.rangeFlag} />}
            <p className="text-caption break-words text-text-secondary">{row.referenceRange}</p>
            <p className="text-caption break-words text-text-secondary">{row.source}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
