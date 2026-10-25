import type { HealthProfile } from '@src/features/profiles/application/ports';
import type { MeasurementKind } from '../../application/ports';
import type { useMeasurementSeries } from '../../application/useMeasurementSeries';
import type { useProfileMeasurements } from '../../application/useProfileMeasurements';
import { MeasurementTableSection } from './MeasurementTableSection';
import { MeasurementTrendSection } from './MeasurementTrendSection';

type Props = {
  profile: HealthProfile | undefined;
  kind: MeasurementKind;
  weeks: number;
  series: ReturnType<typeof useMeasurementSeries>;
  measurements: ReturnType<typeof useProfileMeasurements>;
  medication: string | null;
  onMedicationChange: (key: string) => void;
};

// Biểu đồ + bảng số đo; hồ sơ chưa đồng thuận chỉ hiện thông báo chung (không gọi API, spec §4.6).
export function ProfileHealthSections({ profile, measurements, ...trend }: Props) {
  if (profile && profile.consentStatus !== 'confirmed') {
    return (
      <p role="alert" className="rounded-[20px] bg-white p-6 text-sm">
        Hồ sơ chưa được đồng ý lưu dữ liệu.
      </p>
    );
  }
  return (
    <>
      <MeasurementTrendSection {...trend} />
      <MeasurementTableSection kind={trend.kind} measurements={measurements} />
    </>
  );
}
