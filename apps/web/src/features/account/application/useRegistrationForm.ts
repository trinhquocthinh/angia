import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { accountErrorMessage } from './accountErrorMessage';
import { prepareRegistration } from './prepareRegistration';
import { registrationErrorField } from './registrationErrorField';
import { useLegalDocuments } from './useLegalDocuments';
import type { FetchCurrentLegal, RegistrationValues, SubmitRegistration } from './ports';
export function useRegistrationForm(
  submitRegistration: SubmitRegistration,
  fetchLegal: FetchCurrentLegal,
  onSuccess: () => Promise<unknown>,
) {
  const form = useForm<RegistrationValues>({
    defaultValues: {
      username: '',
      password: '',
      displayName: '',
      email: '',
      ageConfirmed: false,
      legalAgreed: false,
    },
  });
  const documents = useLegalDocuments(fetchLegal);
  const [error, setError] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);
  const submit = form.handleSubmit(async (values) => {
    if (!documents.legal || !values.legalAgreed || documents.loading) return;
    setError(null);
    setClosed(false);
    form.clearErrors();
    const result = await submitRegistration(prepareRegistration(values, documents.legal));
    if (result.ok) {
      await onSuccess();
      return;
    }
    const message = accountErrorMessage(result.code);
    const field = registrationErrorField(result);
    if (field) {
      form.setError(field, { type: 'server', message });
      // Chờ fieldset được bật lại trước khi chuyển focus đến ô lỗi.
      requestAnimationFrame(() => form.setFocus(field));
    } else if (result.code === 'ERR_REGISTRATION_CLOSED') setClosed(true);
    else {
      setError(message);
      if (result.code === 'ERR_LEGAL_VERSION_OUTDATED') {
        form.setValue('legalAgreed', false);
        await documents.refresh(result.current);
      }
    }
  });
  return {
    form,
    submit,
    legal: documents.legal,
    loadingLegal: documents.loading,
    error: documents.error ?? error,
    closed,
  };
}
