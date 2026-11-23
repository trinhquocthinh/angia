import { useId } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { PasswordResetRequest } from '@src/features/account/application/ports';
import { PasswordResetIcon } from '@src/features/account/presentation/password/PasswordResetIcon';

export function PasswordResetEmailField({ form }: { form: UseFormReturn<PasswordResetRequest> }) {
  const id = useId();
  const error = form.formState.errors.email?.message;
  const email = form.watch('email');
  function clear() {
    form.setValue('email', '');
    form.clearErrors('email');
    form.setFocus('email');
  }
  return (
    <div className="forgot-field">
      <label htmlFor={id}>
        Email <span aria-hidden="true">Bắt buộc</span>
      </label>
      <div className="forgot-input" data-invalid={Boolean(error)}>
        <PasswordResetIcon name="mail" />
        <input
          {...form.register('email')}
          id={id}
          type="email"
          required
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Ví dụ: lan@email.com"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {email && (
          <button type="button" onClick={clear} aria-label="Xoá email">
            <PasswordResetIcon name="cancel" />
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="forgot-field-error" role="alert">
          <PasswordResetIcon name="error" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
