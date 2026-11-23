import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type {
  PasswordResetRequest,
  SubmitPasswordResetRequest,
} from '@src/features/account/application/ports';
import { requestPasswordReset } from '@src/features/account/application/requestPasswordReset';

export function useForgotPasswordForm(submitRequest: SubmitPasswordResetRequest) {
  const form = useForm<PasswordResetRequest>({ defaultValues: { email: '' } });
  const [sent, setSent] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = form.handleSubmit(async ({ email }) => {
    setError(null);
    setResent(false);
    const result = await requestPasswordReset(email, submitRequest);
    if (result.status === 'sent') {
      setSent(true);
      setResent(sent);
    } else if (result.status === 'invalid' && !sent) {
      form.setError('email', { type: 'validate', message: result.message });
      requestAnimationFrame(() => form.setFocus('email'));
    } else setError(result.message);
  });
  return { form, sent, resent, error, submit };
}
