import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import type { MedicationPeriods } from '../application/medicationPeriods';
import { STATUS_LABEL } from '../application/periodText';

// Trạng thái gần nhất của từng thuốc đã ghi nhận, để người dùng biết mốc mới phải sau ngày nào.
export function AdherenceStatusList({ groups }: { groups: MedicationPeriods[] }) {
  if (groups.length === 0)
    return <p className="text-sm text-text-secondary">Chưa ghi nhận giai đoạn dùng thuốc nào.</p>;
  return (
    <section aria-labelledby="adherence-status-title" className="flex flex-col gap-2">
      <h3
        id="adherence-status-title"
        className="text-xs font-bold tracking-wider text-text-secondary uppercase"
      >
        Đã ghi nhận
      </h3>
      <ul className="flex flex-col divide-y divide-[var(--color-accent-soft)] rounded-xl border border-border">
        {groups.map((group) => {
          const latest = group.periods.at(-1)!;
          return (
            <li key={group.key} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="font-semibold text-text-primary">{group.name}</span>
              <span className="text-text-secondary tabular-nums">
                {STATUS_LABEL[latest.status]} từ {formatDay(latest.fromDate)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
