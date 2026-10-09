import { useId } from 'react';
type Props = {
  label: string;
  value: string;
  invalid: boolean;
  disabled: boolean;
  errorId: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
};
export function PrivacyCoordinateInput({
  label,
  value,
  invalid,
  disabled,
  errorId,
  onChange,
  onCommit,
  onCancel,
}: Props) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-1 text-xs text-[#55615f]">
      {label.split(' — ')[1]}
      <span className="relative">
        <input
          id={id}
          aria-label={label}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          max={100}
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onCommit}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === 'Escape') {
              event.preventDefault();
              if (event.key === 'Enter') onCommit();
              else onCancel();
            }
          }}
          className="min-h-11 w-full rounded-lg border border-[#d6e5df] bg-white pl-3 pr-7 text-center text-base font-semibold text-[#004135] focus-visible:outline-2 focus-visible:outline-[#286958] aria-invalid:border-[#9b472c]"
        />
        <span aria-hidden="true" className="pointer-events-none absolute right-2 top-3 text-[#707975]">
          %
        </span>
      </span>
    </label>
  );
}
