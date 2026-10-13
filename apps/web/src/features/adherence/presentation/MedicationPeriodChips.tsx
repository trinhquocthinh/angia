import type { MedicationPeriods } from '../application/medicationPeriods';

type Props = { groups: MedicationPeriods[]; selected: string; onSelect: (key: string) => void };

// Mỗi lần tô nền theo một thuốc (owner chốt E5-S3-T2); chip chỉ phân biệt thuốc, không mang nhận định.
export function MedicationPeriodChips({ groups, selected, onSelect }: Props) {
  return (
    <div
      role="group"
      aria-label="Tô nền theo giai đoạn của thuốc"
      className="flex flex-wrap items-center gap-2"
    >
      <span className="text-xs font-semibold text-[#55615f]">Giai đoạn thuốc:</span>
      {groups.map((group) => (
        <button
          key={group.key}
          type="button"
          aria-pressed={group.key === selected}
          onClick={() => onSelect(group.key)}
          className="min-h-9 rounded-full border border-[#d9e5e4] bg-white px-3 text-sm font-medium text-[#404945] hover:bg-[#eaf6f5] aria-pressed:border-[#2f6f5e] aria-pressed:bg-[#e3efea] aria-pressed:font-semibold aria-pressed:text-[#004135] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
        >
          {group.name}
        </button>
      ))}
    </div>
  );
}
