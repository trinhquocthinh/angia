import { AdherenceOverlay } from '@src/features/adherence/presentation/AdherenceOverlay';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import type { MeasurementKind } from '../../application/ports';
import type { useMeasurementSeries } from '../../application/useMeasurementSeries';
import { ChartSkeleton, MeasurementTrend } from './MeasurementTrend';

type Props = {
  kind: MeasurementKind;
  weeks: number;
  series: ReturnType<typeof useMeasurementSeries>;
  /** Tên chuẩn hóa của thuốc đang tô nền; null → thuốc có mốc mới nhất. */
  medication: string | null;
  onMedicationChange: (key: string) => void;
};

const TITLE: Record<MeasurementKind, string> = {
  blood_pressure: 'Diễn biến huyết áp',
  glucose: 'Diễn biến đường huyết (mmol/L)',
};

// Khung "Diễn biến … N tuần" chuẩn 3D Bento v2.0 (Stitch c5e09b60) kèm nền giai đoạn dùng thuốc.
export function MeasurementTrendSection({
  kind,
  weeks,
  series: { range, query },
  medication,
  onMedicationChange,
}: Props) {
  return (
    <section
      aria-labelledby="measurement-trend-title"
      className="profile-bento-card flex flex-col gap-4 p-5 lg:p-6"
    >
      <div className="flex items-center gap-3">
        <ProfileSectionIcon name="monitor_heart" size={34} />
        <h2 id="measurement-trend-title" className="auth-heading text-heading-2 font-semibold text-accent">
          {TITLE[kind]} {weeks} tuần
        </h2>
      </div>
      {query.isPending ? (
        <ChartSkeleton />
      ) : query.isError ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-2xl bg-danger-soft p-4 text-caption"
        >
          <p>Không tải được biểu đồ.</p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="min-h-btn rounded-2xl bg-surface px-4 text-button-secondary font-semibold text-accent"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <AdherenceOverlay
          periods={query.data.periods}
          range={range}
          selected={medication}
          onSelect={onMedicationChange}
        >
          {(bands) => (
            <MeasurementTrend kind={kind} weeks={weeks} range={range} series={query.data} bands={bands} />
          )}
        </AdherenceOverlay>
      )}
    </section>
  );
}
