import { lazy, Suspense } from 'react';
import type { PainContext, PainEntry } from '@angia/contracts';
import { buildPainChartData } from '../../application/buildPainChartData';
import { PainChartCards } from './PainChartCards';
import { PainChartTable } from './PainChartTable';
import { PainMedicationText } from './PainMedicationText';
import { painMedicationSeries } from './painMedicationSeries';
const PainChartCanvas = lazy(() =>
  import('./PainChartCanvas').then((module) => ({ default: module.PainChartCanvas })),
);

export function PainChartContent({
  entries,
  range,
  weeks,
  location,
  context,
}: {
  entries: PainEntry[];
  range: { from: string; to: string };
  weeks: number;
  location: string;
  context?: PainContext | undefined;
}) {
  const data = buildPainChartData(entries, range);
  const { rows } = painMedicationSeries(context, range);
  const extra = rows ? rows * 28 + 24 : 0;
  return (
    <div className="space-y-4">
      {data.entries.length < 4 ? (
        <PainChartCards entries={data.entries} weeks={weeks} />
      ) : (
        <div
          aria-hidden="true"
          className="[--pain-chart-height:240px] md:[--pain-chart-height:288px]"
          style={{ height: `calc(var(--pain-chart-height) + ${extra}px)` }}
        >
          <Suspense fallback={<p>Đang tải biểu đồ…</p>}>
            <PainChartCanvas points={data.points} range={range} context={context} />
          </Suspense>
        </div>
      )}
      <PainChartTable entries={data.entries} location={location} range={range} />
      {context && <PainMedicationText context={context} />}
    </div>
  );
}
