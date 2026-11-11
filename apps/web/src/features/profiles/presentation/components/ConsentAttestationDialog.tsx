import { useEffect, useRef, useState } from 'react';
import type { ProfileListItem, ProfilesRepository, ProfileSession } from '../../application/ports';
import type { ConsentDraft } from '../../application/readConsentDraft';
import { useConfirmProfileConsent } from '../../application/useConfirmProfileConsent';
import { ConsentAttestationForm } from './ConsentAttestationForm';
type Props = {
  profile: ProfileListItem;
  repository: ProfilesRepository;
  session: ProfileSession;
  onClose: () => void;
};
export function ConsentAttestationDialog({ profile, repository, session, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<ConsentDraft>({ checked: false, basis: '', respondentName: '' });
  const confirmation = useConfirmProfileConsent(repository, session, profile);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="consent-attestation-title"
      aria-describedby="consent-attestation-description"
      className="fixed inset-0 m-auto max-h-[90dvh] w-[520px] max-w-[calc(100%-2rem)] overflow-y-auto rounded-[20px] border-0 bg-surface p-0 text-text-primary shadow-xl backdrop:bg-overlay/20 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-3 [&_button:focus-visible]:outline-focus"
      onCancel={(event) => {
        event.preventDefault();
        if (!confirmation.pending) onClose();
      }}
    >
      <ConsentAttestationForm
        profile={profile}
        draft={draft}
        pending={confirmation.pending}
        error={confirmation.error?.message ?? null}
        onChange={setDraft}
        onCancel={() => {
          if (!confirmation.pending) onClose();
        }}
        onSubmit={(body) => {
          void confirmation.submit(body).then((success) => {
            if (success) onClose();
          });
        }}
      />
    </dialog>
  );
}
