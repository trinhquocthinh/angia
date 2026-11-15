import { useId } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
type Props = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children'> & {
  label: ReactNode;
  error?: string | undefined;
};
export function AccountCheckbox({ label, error, id, ...props }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy =
    [props['aria-describedby'], error && `${inputId}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div>
      <div className="flex min-h-12 items-start gap-3">
        <input
          {...props}
          id={inputId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="mt-1 h-6 w-6 shrink-0 accent-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus aria-invalid:outline aria-invalid:outline-danger"
        />
        <label htmlFor={inputId} className="min-h-12 text-lg leading-7">
          {label}
        </label>
      </div>
      {error && (
        <p id={`${inputId}-error`} role="alert" className="mt-2 text-base leading-6 text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
