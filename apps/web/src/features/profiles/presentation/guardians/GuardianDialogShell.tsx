import { GuardianDialogActions } from './GuardianDialogActions';
import { GuardianDialogError } from './GuardianDialogError';
import type { GuardianDialogProps } from './guardianDialogProps';
import { useId } from 'react';
import { ModalSurface } from '@src/shared/ui/ModalSurface';

export function GuardianDialogShell(props: GuardianDialogProps) {
  const titleId = useId();

  return (
    <ModalSurface
      className="profile-guardian-dialog"
      labelledBy={titleId}
      pending={props.pending}
      onClose={props.onClose}
    >
      <div className="profile-guardian-dialog-body" aria-busy={props.pending}>
        <div className="profile-guardian-dialog-head">
          <h3 id={titleId}>{props.title}</h3>
          <button
            type="button"
            className="profile-guardian-dialog-close"
            aria-label={props.closeLabel}
            disabled={props.pending}
            onClick={props.onClose}
          >
            <img
              src="/images/household/stitch/home-close.svg"
              width={18}
              height={18}
              alt=""
              aria-hidden="true"
            />
          </button>
        </div>
        {props.children}
        {props.error && <GuardianDialogError message={props.error} />}
        <GuardianDialogActions {...props} />
      </div>
    </ModalSurface>
  );
}
