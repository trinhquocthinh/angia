import type { GuardianDialogProps } from './guardianDialogProps';

export function GuardianDialogActions(props: GuardianDialogProps) {
  const confirmClass =
    props.confirmTone === 'danger' ? 'profile-guardian-btn-danger' : 'profile-guardian-btn-primary';
  return (
    <div className="profile-guardian-dialog-actions">
      <button
        type="button"
        data-autofocus
        className="profile-guardian-btn-cancel"
        disabled={props.pending}
        onClick={props.onClose}
      >
        Huỷ
      </button>
      <button
        type="button"
        className={confirmClass}
        disabled={props.confirmDisabled}
        onClick={props.onConfirm}
      >
        {props.confirmLabel}
      </button>
    </div>
  );
}
