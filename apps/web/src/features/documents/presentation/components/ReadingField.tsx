import type { InputHTMLAttributes, ReactNode } from 'react';

type ReadingFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  unit?: string;
  error?: string | undefined;
  flagged?: boolean;
  hint?: ReactNode;
  // Ô chữ (nơi khám, chẩn đoán, cách dùng) dùng cỡ chữ thường thay cho con số lớn.
  compact?: boolean;
};

// Khung ô (nền, viền lỗi/focus) bọc cả ô nhập và đơn vị: đơn vị nằm cạnh, không chồng lên chữ số.
const boxClass =
  'flex min-h-12 items-center gap-2 rounded-xl bg-[#eaf6f5] px-4 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-[#286958] has-[input[aria-invalid=true]]:outline-2 has-[input[aria-invalid=true]]:outline-[#b42318]';
const inputClass = 'min-h-12 min-w-0 flex-1 bg-transparent text-[#131d1d] outline-none read-only:opacity-50';

// Ô số đo: con số lớn (Design §3), đơn vị nhỏ màu phụ; lỗi hiển thị ngay dưới ô (SPEC-010).
export function ReadingField({
  id,
  label,
  unit,
  error,
  flagged = false,
  hint,
  compact = false,
  ...input
}: ReadingFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[#3f4946]">
        {label}
      </label>
      <div className={`${boxClass} ${flagged && !error ? 'bg-[#fff4e5]' : ''}`}>
        <input
          id={id}
          aria-invalid={Boolean(error) || flagged || undefined}
          aria-describedby={describedBy}
          className={`${inputClass} ${compact ? 'text-base' : 'text-lg font-semibold tabular-nums'}`}
          {...input}
        />
        {unit && <span className="shrink-0 text-xs whitespace-nowrap text-[#55615f]">{unit}</span>}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-[#b42318]">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-[#55615f]">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
