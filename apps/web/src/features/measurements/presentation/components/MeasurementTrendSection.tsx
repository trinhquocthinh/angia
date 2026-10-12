import type { MeasurementKind } from '../../application/ports';
import type { useMeasurementSeries } from '../../application/useMeasurementSeries';
import { ChartSkeleton, MeasurementTrend } from './MeasurementTrend';

type Props = {
  kind: MeasurementKind;
  weeks: number;
  series: ReturnType<typeof useMeasurementSeries>;
};

const TITLE: Record<MeasurementKind, string> = {
  blood_pressure: 'Diễn biến huyết áp',
  glucose: 'Diễn biến đường huyết (mmol/L)',
};

// Khung "Diễn biến … N tuần" (Stitch 718c9615); giai đoạn dùng thuốc (markArea) thuộc E5-S3-T2.
export function MeasurementTrendSection({ kind, weeks, series: { range, query } }: Props) {
  return (
    <section
      aria-labelledby="measurement-trend-title"
      className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm lg:p-6"
    >
      <h2 id="measurement-trend-title" className="text-lg font-semibold text-[#004135]">
        {TITLE[kind]} {weeks} tuần
      </h2>
      {query.isPending ? (
        <ChartSkeleton />
      ) : query.isError ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl bg-[#fdecea] p-4 text-sm">
          <p>Không tải được biểu đồ.</p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="min-h-11 rounded-xl bg-white px-4 font-semibold text-[#004135]"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <MeasurementTrend kind={kind} weeks={weeks} range={range} series={query.data} />
      )}
    </section>
  );
}
