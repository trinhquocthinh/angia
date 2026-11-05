import { currentVietnamYear } from '../application/currentVietnamYear';
import { ProfileRequestError } from '../application/ProfileRequestError';
import { useRef, useState } from 'react';
import type { ProfileRequest } from '../application/ports';
import { readConsentDraft, type ConsentDraft } from '../application/readConsentDraft';
import { readProfileDraft } from '../application/readProfileDraft';
export function useProfileForm(
  pending: boolean,
  onSave: (body: ProfileRequest) => Promise<unknown>,
  currentAccountId: string,
  consentDraft: ConsentDraft,
) {
  const [errors, setErrors] = useState<{
    displayName?: string;
    birthYear?: string;
    linkedAccountId?: string;
  }>({});
  const [error, setError] = useState('');
  const sending = useRef(false);
  const save = async (form: HTMLFormElement) => {
    if (pending || sending.current) return;
    const data = new FormData(form);
    const year = currentVietnamYear();
    const linkedAccountId = String(data.get('linkedAccountId') ?? '');
    const mode = !linkedAccountId
      ? 'attestation'
      : linkedAccountId === currentAccountId
        ? 'self'
        : 'invitation';
    const consent = readConsentDraft(consentDraft, mode);
    const draft = readProfileDraft(
      String(data.get('displayName') ?? ''),
      String(data.get('birthYear') ?? ''),
      String(data.get('linkedAccountId') ?? ''),
      year,
    );
    setErrors(draft.errors);
    setError('');
    if (!draft.body || consent.body === null) {
      setError(consent.error);
      return;
    }
    sending.current = true;
    try {
      await onSave({ ...draft.body, ...(consent.body ? { consent: consent.body } : {}) });
    } catch (cause) {
      if (
        cause instanceof ProfileRequestError &&
        ['ERR_PROFILE_ALREADY_LINKED', 'ERR_NOT_FOUND'].includes(cause.code ?? '')
      )
        setErrors({ linkedAccountId: cause.message });
      else setError(cause instanceof Error ? cause.message : 'Không thể lưu hồ sơ. Vui lòng thử lại.');
    } finally {
      sending.current = false;
    }
  };
  return { errors, error, save };
}
