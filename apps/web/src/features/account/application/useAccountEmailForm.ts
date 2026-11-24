import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useEmailVerificationRequest } from './useEmailVerificationRequest';
import type {
  ChangeAccountEmailBody,
  SubmitAccountEmailChange,
  SubmitEmailVerificationRequest,
} from '@src/features/account/application/ports';
import { updateAccountEmail } from '@src/features/account/application/updateAccountEmail';

type Options = {
  csrfToken: string;
  submitEmail: SubmitAccountEmailChange;
  submitVerify: SubmitEmailVerificationRequest;
  onRefreshSession: () => Promise<void>;
  initialEditing?: boolean;
};

export function useAccountEmailForm({
  csrfToken,
  submitEmail,
  submitVerify,
  onRefreshSession,
  initialEditing = false,
}: Options) {
  const form = useForm<ChangeAccountEmailBody>({ defaultValues: { email: '', currentPassword: '' } });
  const [editing, setEditing] = useState(initialEditing);
  const [formError, setFormError] = useState<string | null>(null);
  const verification = useEmailVerificationRequest(csrfToken, submitVerify, onRefreshSession);

  const toggleForm = (open: boolean) => {
    setFormError(null);
    form.reset({ email: '', currentPassword: '' });
    setEditing(open);
    if (open) requestAnimationFrame(() => form.setFocus('email'));
  };

  const submit = form.handleSubmit(async (values) => {
    setFormError(null);
    const result = await updateAccountEmail(values, csrfToken, submitEmail);
    if (result.status === 'updated') {
      toggleForm(false);
      verification.clear();
      await onRefreshSession();
    } else if (result.status === 'invalid') {
      form.setError(result.field, { type: 'validate', message: result.message });
      requestAnimationFrame(() => form.setFocus(result.field));
    } else setFormError(result.message);
  });

  return {
    form,
    editing,
    formError,
    verifyBusy: verification.busy,
    verifyNotice: verification.notice,
    verifyError: verification.error,
    openForm: () => toggleForm(true),
    closeForm: () => toggleForm(false),
    submit,
    requestVerification: verification.request,
  };
}
