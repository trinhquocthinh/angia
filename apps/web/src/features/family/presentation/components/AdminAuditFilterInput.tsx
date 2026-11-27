import { useId } from 'react';
export function AdminAuditFilterInput({
  label,
  type = 'text',
  value,
  onChange,
  error,
  describedBy,
}: {
  label: string;
  type?: 'text' | 'date';
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  describedBy?: string | undefined;
}) {
  const id = useId();
  return (
    <label className="flex min-w-0 flex-col gap-2 text-body text-text-secondary">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? id : describedBy}
        className="min-h-11 w-full min-w-0 max-w-full rounded-2xl border border-border/45 bg-bg px-3.5 text-body text-text-primary transition-colors focus:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      />
      {error && (
        <span id={id} role="status" className="text-caption text-danger">
          {error}
        </span>
      )}
    </label>
  );
}
