import { ConsentBody } from './ConsentBody';
import { useEffect, useRef, useState } from 'react';
import type { ConsentResponse, HealthProfile } from '../../application/ports';
import { consentMessage } from '../consentMessage';
export function ConsentDialog({
  profile,
  pending,
  onConfirm,
  onClose,
}: {
  profile: HealthProfile;
  pending: boolean;
  onConfirm: (basis: 'self' | 'guardian') => Promise<ConsentResponse>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [basis, setBasis] = useState<'self' | 'guardian' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  const confirm = async () => {
    if (!basis || pending || message) return;
    setError('');
    try {
      setMessage(consentMessage(await onConfirm(basis)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể xác nhận. Vui lòng thử lại.');
    }
  };
  return (
    <dialog
      ref={ref}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-[420px] max-w-full overflow-y-auto border-0 bg-white p-0 text-[#131d1d] shadow-[0_-4px_16px_rgba(31,42,42,0.1)] backdrop:bg-[#131d1d]/35 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-3 [&_button:focus-visible]:outline-[#286958] max-md:inset-x-0 max-md:top-auto max-md:bottom-0 max-md:h-auto max-md:max-h-[90dvh] max-md:w-full max-md:rounded-t-[20px] max-md:pb-[env(safe-area-inset-bottom)]"
      aria-labelledby="consent-title"
      aria-describedby="consent-description"
      onCancel={() => onClose()}
    >
      <ConsentBody
        name={profile.displayName}
        basis={basis}
        pending={pending}
        message={message}
        error={error}
        setBasis={setBasis}
        confirm={confirm}
        onClose={onClose}
      />
    </dialog>
  );
}
