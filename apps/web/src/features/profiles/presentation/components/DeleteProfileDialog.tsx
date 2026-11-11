import { useEffect, useRef, useState } from 'react';
import type { HealthProfile, ProfilesRepository, ProfileSession } from '../../application/ports';
import { useDeleteProfile } from '../../application/useDeleteProfile';
import { DeleteProfileForm } from './DeleteProfileForm';
export function DeleteProfileDialog({
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
  const [value, setValue] = useState('');
  const deletion = useDeleteProfile(repository, session);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  const close = () => {
    if (!deletion.pending) onClose();
  };
  return (
    <dialog
      ref={ref}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-[440px] max-w-full overflow-y-auto border-0 bg-surface p-0 text-text-primary shadow-[0_-4px_16px_color-mix(in_srgb,var(--color-shadow)_10%,transparent)] backdrop:bg-overlay/20 backdrop:backdrop-blur-sm [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-3 [&_button:focus-visible]:outline-focus max-md:inset-x-0 max-md:top-auto max-md:bottom-0 max-md:h-auto max-md:max-h-[90dvh] max-md:w-full max-md:rounded-t-[20px] max-md:pb-[env(safe-area-inset-bottom)]"
      aria-labelledby="delete-profile-title"
      aria-describedby="delete-profile-description"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <DeleteProfileForm
        name={profile.displayName}
        value={value}
        pending={deletion.pending}
        mismatch={deletion.mismatch}
        failure={deletion.error?.message ?? null}
        onChange={(next) => {
          setValue(next);
          deletion.reset();
        }}
        onSubmit={() => {
          void deletion.submit(profile, value).then((outcome) => {
            if (outcome === 'deleted') onClose();
          });
        }}
        onCancel={close}
      />
    </dialog>
  );
}
