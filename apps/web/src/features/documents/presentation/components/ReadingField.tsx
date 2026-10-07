import type { InputHTMLAttributes, ReactNode } from 'react';

type ReadingFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  unit?: string;
  error?: string | undefined;
  flagged?: boolean;
  hint?: ReactNode;
};

const inputClass =
  'min-h-12 w-full rounded-xl bg-[#eaf6f5] px-4 text-lg font-semibold tabular-nums text-[#131d1d] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958] aria-invalid:outline-2 aria-invalid:outline-[#b42318]';

// Ô số đo: con số lớn (Design §3), đơn vị nhỏ màu phụ; lỗi hiển thị ngay dưới ô (SPEC-010).
export function ReadingField({ id, label, unit, error, flagged = false, hint, ...input }: ReadingFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[#3f4946]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={Boolean(error) || flagged || undefined}
          aria-describedby={describedBy}
          className={`${inputClass} ${unit ? 'pr-20' : ''} ${flagged && !error ? 'bg-[#fff4e5]' : ''}`}
          {...input}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs text-[#55615f]">
            {unit}
          </span>
        )}
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
