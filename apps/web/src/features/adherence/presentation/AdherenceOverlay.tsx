import type { ReactNode } from 'react';
import { groupByMedication, pickDefaultMedication } from '../application/medicationPeriods';
import { periodBands, type PeriodBand } from '../application/periodBands';
import type { AdherencePeriod } from '../application/ports';
import { MedicationPeriodChips } from './MedicationPeriodChips';
import { PeriodList } from './PeriodList';

type Props = {
  periods: AdherencePeriod[];
  range: { from: string; to: string };
  /** Tên chuẩn hóa của thuốc đang chọn; null hoặc không còn trong khoảng → thuốc có mốc mới nhất. */
  selected: string | null;
  onSelect: (key: string) => void;
  children: (bands: PeriodBand[]) => ReactNode;
};

// SPEC-023: chip chọn thuốc → dải nền cho biểu đồ → danh sách giai đoạn bằng chữ.
export function AdherenceOverlay({ periods, range, selected, onSelect, children }: Props) {
  const groups = groupByMedication(periods);
  const key = groups.some((group) => group.key === selected) ? selected : pickDefaultMedication(groups);
  const group = groups.find((item) => item.key === key);
  if (!group) return <>{children([])}</>;
  return (
    <div className="flex flex-col gap-3">
      <MedicationPeriodChips groups={groups} selected={group.key} onSelect={onSelect} />
      {children(periodBands(group.periods, range))}
      <PeriodList group={group} />
    </div>
  );
}
