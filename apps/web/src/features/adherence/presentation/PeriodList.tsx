import { periodText } from '../application/periodText';
import type { MedicationPeriods } from '../application/medicationPeriods';

const SWATCH = {
  taking: 'bg-accent-soft',
  stopped:
    'bg-period-stopped bg-[repeating-linear-gradient(135deg,color-mix(in_srgb,var(--color-period-hatch)_25%,transparent)_0_1px,transparent_1px_6px)]',
} as const;

// Chú giải + bản văn bản của dải nền (đọc được cả khi chưa đủ điểm để vẽ); chỉ trạng thái và ngày (BR-033).
export function PeriodList({ group }: { group: MedicationPeriods }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-text-secondary">
        Giai đoạn {group.name} ({group.periods.length})
      </p>
      <ul className="flex flex-col gap-1 text-sm text-text-secondary">
        {group.periods.map((period) => (
          <li key={period.id} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`h-3 w-5 shrink-0 rounded-sm border border-border ${SWATCH[period.status]}`}
            />
            <span className="tabular-nums">{periodText(period)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
