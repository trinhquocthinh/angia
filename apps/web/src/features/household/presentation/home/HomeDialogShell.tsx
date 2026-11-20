import { HomeDialogActions } from './HomeDialogActions';
import { HomeDialogHeading } from './HomeDialogHeading';
import { useId, type ReactNode } from 'react';
import { ModalSurface } from '@src/shared/ui/ModalSurface';

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
  const titleId = useId();

  return (
    <ModalSurface
      className="household-home-dialog"
      labelledBy={titleId}
      pending={props.pending}
      onClose={props.onClose}
    >
      <div className="household-home-dialog-body" aria-busy={props.pending}>
        <span className="household-home-dialog-handle" aria-hidden="true" />
        <HomeDialogHeading {...props} titleId={titleId} />
        {props.children}
        <HomeDialogActions {...props} />
      </div>
    </ModalSurface>
  );
}
