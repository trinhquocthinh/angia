import type { ReactNode } from 'react';

export function QuotaTextField({
  id,
  label,
  value,
  onChange,
  error,
  mode = 'decimal',
}: {
  id: string;
  label: ReactNode;
  value: string;
  onChange(value: string): void;
  error?: string;
  mode?: 'decimal' | 'numeric' | 'text';
}) {
  return (
    <label htmlFor={id} className="grid content-start gap-1 text-[12px] font-medium text-text-secondary">
      {label}
      <input
        id={id}
        name={id}
        type="text"
        inputMode={mode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="min-h-10 w-full min-w-0 rounded-xl border-0 bg-accent-soft px-3 py-2 text-[13px] font-normal leading-5 text-text-primary focus:bg-accent-soft"
      />
      {error && (
        <span id={`${id}-error`} role="alert" className="text-danger">
          {error}
        </span>
      )}
    </label>
  );
}
