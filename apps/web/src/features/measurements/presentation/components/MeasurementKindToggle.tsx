import type { MeasurementKind } from '../../application/ports';

const OPTIONS: { value: MeasurementKind; label: string }[] = [
  { value: 'blood_pressure', label: 'Huyết áp & Mạch' },
  { value: 'glucose', label: 'Đường huyết' },
];

export function MeasurementKindToggle({
  kind,
  onChange,
}: {
  kind: MeasurementKind;
  onChange: (kind: MeasurementKind) => void;
}) {
  return (
    <div role="group" aria-label="Chọn chỉ số" className="inline-flex rounded-xl bg-[#eaf6f5] p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={kind === option.value}
          onClick={() => onChange(option.value)}
          className="min-h-11 rounded-lg px-4 text-sm font-medium text-[#3f4946] aria-pressed:bg-white aria-pressed:text-[#004135] aria-pressed:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
