import { useEffect, useRef } from 'react';
import type { HealthProfile, ProfilesRepository, ProfileSession } from '../../application/ports';
import { currentVietnamYear } from '../../application/currentVietnamYear';
import { useEditProfile } from '../../application/useEditProfile';
import { useEditProfileForm } from '../useEditProfileForm';
import { EditProfileForm } from './EditProfileForm';
type Props = {
  profile: HealthProfile;
  repository: ProfilesRepository;
  session: ProfileSession;
  onClose: () => void;
};
export function EditProfileDialog({ profile, repository, session, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const edit = useEditProfile(repository, session, profile);
  const close = () => {
    if (!edit.saving) onClose();
  };
  const form = useEditProfileForm(profile, edit.save, onClose);
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
      aria-labelledby="edit-profile-title"
      aria-describedby="edit-profile-description"
      className="fixed inset-0 m-auto max-h-[90dvh] w-[520px] max-w-[calc(100%-2rem)] overflow-y-auto rounded-[20px] border-0 bg-surface p-0 text-text-primary shadow-xl backdrop:bg-overlay/20 [&_input:focus-visible]:outline-2 [&_input:focus-visible]:outline-offset-3 [&_input:focus-visible]:outline-focus [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-3 [&_button:focus-visible]:outline-focus"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <EditProfileForm
        {...form}
        currentYear={currentVietnamYear()}
        pending={edit.saving}
        error={edit.error}
        onClose={close}
      />
    </dialog>
  );
}
