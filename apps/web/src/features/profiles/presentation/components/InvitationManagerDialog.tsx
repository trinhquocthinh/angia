import { useEffect, useRef } from 'react';
import type { HealthProfile, ProfilesRepository, ProfileSession } from '../../application/ports';
import { useInvitationManager } from '../../application/useInvitationManager';
import { InvitationManagerBody } from './InvitationManagerBody';
export function InvitationManagerDialog({
  profile,
  repository,
  session,
  onClose,
}: {
  profile: HealthProfile;
  repository: ProfilesRepository;
  session: ProfileSession;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const manager = useInvitationManager(repository, session, profile.id, profile.consentStatus === 'invited');
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
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-[440px] max-w-full overflow-y-auto border-0 bg-white p-0 text-[#131d1d] shadow-[0_-4px_16px_rgba(31,42,42,0.1)] backdrop:bg-[#131d1d]/20 backdrop:backdrop-blur-sm [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-3 [&_button:focus-visible]:outline-[#286958] max-md:inset-x-0 max-md:top-auto max-md:bottom-0 max-md:h-auto max-md:max-h-[90dvh] max-md:w-full max-md:rounded-t-[20px] max-md:pb-[env(safe-area-inset-bottom)]"
      aria-labelledby="invitation-title"
      aria-describedby="invitation-description"
      onCancel={onClose}
    >
      <InvitationManagerBody name={profile.displayName} {...manager} close={onClose} />
    </dialog>
  );
}
