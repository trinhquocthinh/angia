import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { accountErrorMessage } from './accountErrorMessage';
import { passwordValidation } from './passwordValidation';
import type { PasswordValues } from './passwordValidation';
import type { AccountFailure, SubmitAccountAction } from './ports';
export function useNewPasswordForm(
  action: SubmitAccountAction,
  path: '/api/me/password' | '/api/me/local-credential',
  token: string,
  onSuccess: () => Promise<unknown>,
  onFailure?: (failure: AccountFailure) => boolean,
) {
  const form = useForm<PasswordValues>({ defaultValues: { password: '', confirmation: '' } });
  const [error, setError] = useState<string | null>(null);
  function fieldError(field: keyof PasswordValues, message: string) {
    form.setError(field, { type: 'validate', message });
    requestAnimationFrame(() => form.setFocus(field));
  }
  const submit = form.handleSubmit(async (values) => {
    form.clearErrors();
    setError(null);
    const invalid = passwordValidation(values);
    if (invalid) {
      fieldError(invalid.field, invalid.message);
      return;
    }
    const body =
      path === '/api/me/password' ? { newPassword: values.password } : { password: values.password };
    const result = await action(path, body, token);
    if (result.ok) {
      await onSuccess();
      return;
    }
    if (onFailure?.(result)) return;
    if (result.code === 'ERR_VALIDATION' && result.field)
      fieldError('password', accountErrorMessage(result.code));
    else setError(accountErrorMessage(result.code));
  });
  return { form, submit, error };
}
