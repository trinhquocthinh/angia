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
    <label htmlFor={id} className="grid content-start gap-1.5 text-caption font-medium text-text-secondary">
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
        className="min-h-11 w-full min-w-0 rounded-2xl border border-border/45 bg-bg px-3.5 py-2 text-body font-normal text-text-primary tabular-nums transition-colors focus:bg-surface"
      />
      {error && (
        <span id={`${id}-error`} role="alert" className="text-danger">
          {error}
        </span>
      )}
    </label>
  );
}
