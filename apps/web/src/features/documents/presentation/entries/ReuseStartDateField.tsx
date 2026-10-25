type Props = {
  value: string;
  min: string;
  max: string;
  disabled: boolean;
  onChange: (value: string) => void;
};

// Ngày bắt đầu đợt mới: mặc định hôm nay, chọn trong khoảng (ngày kê, hôm nay + 30] (SPEC-029).
export function ReuseStartDateField({ value, min, max, disabled, onChange }: Props) {
  return (
    <label htmlFor="reuse-start-date" className="flex flex-col gap-1 text-sm font-medium">
      Ngày bắt đầu
      <input
        id="reuse-start-date"
        type="date"
        required
        disabled={disabled}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-xl border border-[#bfc9c4] px-3"
      />
    </label>
  );
}
