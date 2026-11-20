import type { HomeDialogShellProps } from './HomeDialogShell';

export function HomeDialogActions(props: HomeDialogShellProps) {
  return (
    <div className="household-home-dialog-actions">
      <button
        type="button"
        data-autofocus
        className="household-home-dialog-cancel"
        disabled={props.pending}
        onClick={props.onClose}
      >
        Huỷ
      </button>
      <button
        type="button"
        className="household-home-dialog-danger"
        disabled={props.confirmDisabled}
        onClick={props.onConfirm}
      >
        {props.confirmLabel}
      </button>
    </div>
  );
}
