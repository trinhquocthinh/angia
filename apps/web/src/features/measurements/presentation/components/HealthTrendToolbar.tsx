import { normalizeMedicationName } from '@src/features/adherence/application/normalizeMedicationName';
import { AdherenceAction } from '@src/features/adherence/presentation/AdherenceAction';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { MeasurementKind } from '../../application/ports';
import type { WeekSpan } from '../../application/seriesRange';
import { SegmentedToggle } from './SegmentedToggle';

const KIND_OPTIONS = [
  { value: 'blood_pressure', label: 'Huyết áp & Mạch' },
  { value: 'glucose', label: 'Đường huyết' },
] as const;
const WEEK_OPTIONS = [
  { value: 4, label: '4 tuần' },
  { value: 12, label: '12 tuần' },
  { value: 26, label: '26 tuần' },
] as const;

type Props = {
  kind: MeasurementKind;
  weeks: WeekSpan;
  onKindChange: (kind: MeasurementKind) => void;
  onWeeksChange: (weeks: WeekSpan) => void;
  profile: HealthProfile | undefined;
  session: ProfileSession;
  /** Lưu giai đoạn xong → tô nền theo thuốc vừa ghi (tên chuẩn hóa). */
  onMedicationSaved: (key: string) => void;
};

// Thanh bộ lọc Diễn biến chuẩn 3D Bento v2.0 (Stitch c5e09b60 / d782695b): đặt trực tiếp trên nền, không lồng khung trắng thừa.
export function HealthTrendToolbar({ kind, weeks, onKindChange, onWeeksChange, ...adherence }: Props) {
  return (
    <div className="flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
      <SegmentedToggle label="Chọn chỉ số" value={kind} options={KIND_OPTIONS} onChange={onKindChange} />
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center md:justify-end">
        <SegmentedToggle
          label="Khoảng thời gian"
          value={weeks}
          options={WEEK_OPTIONS}
          onChange={onWeeksChange}
        />
        {adherence.profile && (
          <AdherenceAction
            profile={adherence.profile}
            session={adherence.session}
            onSaved={(period) => adherence.onMedicationSaved(normalizeMedicationName(period.medicationName))}
          />
        )}
      </div>
    </div>
  );
}
