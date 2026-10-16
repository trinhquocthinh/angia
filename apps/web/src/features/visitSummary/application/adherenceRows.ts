import type { AdherencePeriod } from '@angia/contracts';
import { groupByMedication } from '@src/features/adherence/application/medicationPeriods';
import { periodText } from '@src/features/adherence/application/periodText';

export interface SummaryAdherenceRow {
  key: string;
  name: string;
  periods: { id: string; status: AdherencePeriod['status']; text: string }[];
}

// "Giai đoạn dùng thuốc" (SPEC-023): nhóm theo thuốc như biểu đồ, mốc tăng dần; chỉ trạng thái + ngày (BR-033).
export function adherenceRows(periods: readonly AdherencePeriod[]): SummaryAdherenceRow[] {
  return groupByMedication([...periods]).map((group) => ({
    key: group.key,
    name: group.name,
    periods: group.periods.map((period) => ({
      id: period.id,
      status: period.status,
      text: periodText(period),
    })),
  }));
}
