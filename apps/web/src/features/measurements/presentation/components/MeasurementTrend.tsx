import { lazy, Suspense } from 'react';
import { buildTrendLines } from '../../application/buildTrendLines';
import { describeSeries } from '../../application/describeSeries';
import type { MeasurementKind, MeasurementSeries } from '../../application/ports';
import { MeasurementStatCards } from './MeasurementStatCards';
import { SeriesDataTable } from './SeriesDataTable';

const MeasurementTrendChart = lazy(() =>
  import('./MeasurementTrendChart').then((module) => ({ default: module.MeasurementTrendChart })),
);

const MIN_CHART_POINTS = 4;

type Props = {
  kind: MeasurementKind;
  weeks: number;
  range: { from: string; to: string };
  series: MeasurementSeries;
};

export const ChartSkeleton = () => (
  <div
    role="status"
    aria-label="Đang tải biểu đồ"
    className="h-72 animate-pulse rounded-2xl bg-[#eaf6f5] motion-reduce:animate-none"
  />
);

// Rỗng → câu nhắc; < 4 điểm → thẻ thống kê; đủ điểm → biểu đồ (aria-hidden) + bảng số liệu ẩn.
export function MeasurementTrend({ kind, weeks, range, series }: Props) {
  const { points } = series;
  if (points.length === 0)
    return (
      <p className="rounded-2xl bg-[#eaf6f5] px-6 py-10 text-center text-sm text-[#3f4946]">
        Chưa có số đo trong {weeks} tuần gần đây.
      </p>
    );
  if (points.length < MIN_CHART_POINTS) return <MeasurementStatCards points={points} weeks={weeks} />;
  const lines = buildTrendLines(kind, points);
  const emptyWeeks = series.weeks.filter((week) => !week.hasMeasurement).length;
  return (
    <div className="flex flex-col gap-2">
      <div className="h-72" aria-hidden="true">
        <Suspense fallback={<ChartSkeleton />}>
          <MeasurementTrendChart lines={lines} range={range} />
        </Suspense>
      </div>
      {lines.some((line) => line.bridges.length > 0) && (
        <p className="text-xs text-[#55615f]">Nét chấm mảnh: đoạn nối qua tuần chưa đo.</p>
      )}
      <SeriesDataTable
        caption={describeSeries(kind, { ...range, points: points.length, emptyWeeks })}
        points={points}
      />
    </div>
  );
}
