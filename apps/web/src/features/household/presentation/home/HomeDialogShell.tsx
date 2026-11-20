import { HomeDialogActions } from './HomeDialogActions';
import { HomeDialogHeading } from './HomeDialogHeading';
import { useId, type ReactNode } from 'react';
import { useModalDialog } from '@src/shared/ui/useModalDialog';
import '@src/shared/ui/modal-motion.css';

export type HomeDialogShellProps = {
  iconName: 'home-logout-danger' | 'home-delete-shield';
  title: string;
  closeLabel: string;
  confirmLabel: string;
  confirmDisabled: boolean;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children: ReactNode;
};

export function HomeDialogShell(props: HomeDialogShellProps) {
  const ref = useModalDialog();
  const titleId = useId();

  return (
    <dialog
      ref={ref}
      className="angia-modal household-home-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!props.pending) props.onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !props.pending) props.onClose();
      }}
    >
      <div className="household-home-dialog-body" aria-busy={props.pending}>
        <span className="household-home-dialog-handle" aria-hidden="true" />
        <HomeDialogHeading {...props} titleId={titleId} />
        {props.children}
        <HomeDialogActions {...props} />
      </div>
    </dialog>
  );
}
