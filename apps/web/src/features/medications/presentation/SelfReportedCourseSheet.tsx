import { useEffect, useRef } from 'react';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { MedicationRepository } from '../application/ports';
import { useSelfReportedCourse } from '../application/useSelfReportedCourse';
import { SelfReportedCourseSheetBody } from './SelfReportedCourseSheetBody';
type Props = {
  profile: HealthProfile;
  session: ProfileSession;
  repository: MedicationRepository;
  onClose: () => void;
};
export function SelfReportedCourseSheet({ profile, session, repository, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const state = useSelfReportedCourse(repository, session, profile.id);
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
      aria-labelledby="supplement-title"
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-[480px] max-w-full overflow-y-auto border-0 bg-white p-6 text-[#131d1d] backdrop:bg-[#131d1d]/20 max-md:inset-x-0 max-md:top-auto max-md:bottom-0 max-md:h-auto max-md:max-h-[90dvh] max-md:w-full max-md:rounded-t-[20px] max-md:pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      onCancel={(event) => {
        event.preventDefault();
        if (!state.pending) onClose();
      }}
    >
      <SelfReportedCourseSheetBody profile={profile} state={state} onClose={onClose} />
    </dialog>
  );
}
