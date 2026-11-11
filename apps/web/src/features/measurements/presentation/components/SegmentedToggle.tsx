type SegmentedToggleProps<T extends string | number> = {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
};

// Nhóm nút chọn một (chỉ số, khoảng tuần): nút đang chọn nền trắng, aria-pressed cho trình đọc màn hình.
export function SegmentedToggle<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: SegmentedToggleProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-xl bg-accent-soft p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className="min-h-11 rounded-lg px-4 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary aria-pressed:bg-surface aria-pressed:font-semibold aria-pressed:text-accent aria-pressed:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
