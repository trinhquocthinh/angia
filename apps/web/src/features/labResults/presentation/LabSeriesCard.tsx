import type { LabSeries } from '@angia/contracts';
import { labResultRows } from '../application/labResultRows';
import { LabRangeFlag } from './LabRangeFlag';

type Props = { series: LabSeries; headingId: string; note: string | null };

// Thẻ một chỉ số: các lần xét nghiệm (mới nhất trên), giá trị nguyên văn, khoảng tham chiếu in trên phiếu,
// ghi chú tra cứu trung tính (BR-022) và chip khi giá trị ngoài khoảng in trên phiếu (BR-033 làm rõ 2026-10-25).
export function LabSeriesCard({ series, headingId, note }: Props) {
  const noteId = `${headingId}-note`;
  const rows = labResultRows(series.results);
  return (
    <section
      aria-labelledby={headingId}
      aria-describedby={note ? noteId : undefined}
      className="flex flex-col gap-3 rounded-xl bg-surface p-5 shadow-sm"
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <h3 id={headingId} className="min-w-0 text-lg font-semibold break-words text-accent">
            {series.testName}
          </h3>
          <span className="shrink-0 text-xs font-medium text-text-secondary">{rows.length} lần</span>
        </div>
        {note && (
          <p id={noteId} className="text-[13px] text-text-secondary">
            {note}
          </p>
        )}
      </div>
      <ol className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-1 rounded-xl bg-bg p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-sm font-medium text-text-secondary tabular-nums">{row.date}</span>
              <span className="min-w-0 text-right break-words">
                <span
                  className={`text-xl font-semibold tabular-nums ${row.rangeFlag ? 'text-warning' : 'text-text-primary'}`}
                >
                  {row.value}
                </span>
                {row.unit && <span className="ml-1 text-sm text-text-secondary">{row.unit}</span>}
              </span>
            </div>
            {row.rangeFlag && <LabRangeFlag flag={row.rangeFlag} />}
            <p className="text-sm break-words text-text-secondary">{row.referenceRange}</p>
            <p className="text-xs break-words text-text-secondary">{row.source}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
