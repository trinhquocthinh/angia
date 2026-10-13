import type { LabSeries } from '@angia/contracts';
import { labResultRows } from '../application/labResultRows';

// Thẻ một chỉ số: các lần xét nghiệm (mới nhất trên), giá trị nguyên văn, khoảng tham chiếu in trên phiếu.
// Không tô màu hay nhãn so với khoảng tham chiếu (BR-033).
export function LabSeriesCard({ series, index }: { series: LabSeries; index: number }) {
  const headingId = `lab-series-${index}`;
  const rows = labResultRows(series.results);
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 id={headingId} className="min-w-0 text-lg font-semibold break-words text-[#004135]">
          {series.testName}
        </h3>
        <span className="shrink-0 text-xs font-medium text-[#707975]">{rows.length} lần</span>
      </div>
      <ol className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-1 rounded-xl bg-[#f6fbfa] p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-sm font-medium text-[#404945] tabular-nums">{row.date}</span>
              <span className="min-w-0 text-right break-words">
                <span className="text-xl font-semibold text-[#131d1d] tabular-nums">{row.value}</span>
                {row.unit && <span className="ml-1 text-sm text-[#404945]">{row.unit}</span>}
              </span>
            </div>
            <p className="text-sm break-words text-[#404945]">{row.referenceRange}</p>
            <p className="text-xs break-words text-[#707975]">{row.source}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
