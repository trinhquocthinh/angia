import { useId } from 'react';
import type { ComponentPropsWithRef } from 'react';

type Props = Omit<ComponentPropsWithRef<'input'>, 'children'> & {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
};

/** Trường nhập có nhãn và thông báo liên kết bằng ID; giữ nguyên ref và props native. */
export function Field({ label, hint, error, id, className = '', ...props }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy =
    [props['aria-describedby'], hint && `${inputId}-hint`, error && `${inputId}-error`]
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <div className="min-w-0 font-sans">
      <label htmlFor={inputId} className="mb-2 block text-base leading-6 font-medium text-text-primary">
        {label}
        {props.required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        {...props}
        id={inputId}
        aria-invalid={error ? true : props['aria-invalid']}
        aria-describedby={describedBy}
        className={`min-h-12 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-lg leading-7 text-text-primary placeholder:text-text-secondary aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus ${className}`}
      />
      {hint && (
        <p id={`${inputId}-hint`} className="mt-2 text-base leading-6 text-text-secondary">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} role="alert" className="mt-2 text-base leading-6 text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
