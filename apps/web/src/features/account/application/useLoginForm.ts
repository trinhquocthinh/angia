import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { accountErrorMessage } from './accountErrorMessage';
import type { LoginRequest, SubmitPasswordLogin } from './ports';
export function useLoginForm(
  submitLogin: SubmitPasswordLogin,
  onSuccess: (session: {
    csrfToken: string;
    expiresAt: string;
    passwordChangeRequired: boolean;
  }) => Promise<unknown>,
  hasAuthError: boolean,
) {
  const form = useForm<LoginRequest>({ defaultValues: { identifier: '', password: '' } });
  const [error, setError] = useState<string | null>(
    hasAuthError ? 'Không thể xác thực tài khoản. Vui lòng thử lại.' : null,
  );
  const submit = form.handleSubmit(async (values) => {
    setError(null);
    const result = await submitLogin(values);
    if (result.ok) await onSuccess(result.data.session);
    else setError(accountErrorMessage(result.code));
  });
  return { form, error, submit };
}
