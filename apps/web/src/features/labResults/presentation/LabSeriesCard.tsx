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
          <h3
            id={headingId}
            className="auth-heading min-w-0 text-heading-2 font-semibold break-words text-accent"
          >
            {series.testName}
          </h3>
          <span className="shrink-0 rounded-full bg-secondary-container px-2.5 py-0.5 text-caption font-semibold text-on-secondary-container tabular-nums">
            {rows.length} lần
          </span>
        </div>
        {note && (
          <p id={noteId} className="text-caption text-text-secondary">
            {note}
          </p>
        )}
      </div>
      <ol className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-1.5 rounded-2xl border border-border/35 bg-bg p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="rounded-lg border border-border/30 bg-surface px-2.5 py-0.5 text-caption font-semibold text-text-secondary tabular-nums">
                {row.date}
              </span>
              <span className="min-w-0 text-right break-words">
                <span className="text-heading-2 font-bold text-text-primary tabular-nums">{row.value}</span>
                {row.unit && <span className="ml-1 text-caption text-text-secondary">{row.unit}</span>}
              </span>
            </div>
            {row.rangeFlag && <LabRangeFlag flag={row.rangeFlag} />}
            <div className="mt-0.5 border-t border-border/25 pt-1.5 text-caption text-text-secondary">
              <p className="break-words">{row.referenceRange}</p>
              <p className="break-words">{row.source}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
