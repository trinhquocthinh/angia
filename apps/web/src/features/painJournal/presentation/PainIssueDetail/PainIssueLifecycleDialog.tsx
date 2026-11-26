import { useId, type ReactNode } from 'react';
import { ModalDialog } from '@src/shared/ui/ModalDialog';
type Props = {
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  pending: boolean;
  disabled: boolean;
  error: string | null;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  children: ReactNode;
};
export function PainIssueLifecycleDialog(props: Props) {
  const id = useId();
  return (
    <ModalDialog
      labelledBy={id}
      role={props.danger ? 'alertdialog' : 'dialog'}
      onCancel={props.onClose}
      pending={props.pending}
      width="md"
    >
      <h2
        id={id}
        className="auth-heading border-b border-border/35 px-5 py-4 text-heading-2 font-semibold text-accent"
      >
        {props.title}
      </h2>
      <form
        className="flex min-h-0 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          if (!props.disabled && !props.pending) void props.onConfirm();
        }}
      >
        <div className="space-y-3 overflow-y-auto p-5" aria-busy={props.pending}>
          {props.children}
          {props.error && (
            <p role="alert" className="rounded-2xl bg-danger-soft p-3 text-body text-danger">
              {props.error}
            </p>
          )}
        </div>
        <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-border/35 bg-surface p-4">
          <button
            type="button"
            disabled={props.pending}
            onClick={props.onClose}
            className="min-h-btn cursor-pointer rounded-2xl border border-border/45 bg-bg px-5 text-button-secondary font-semibold text-text-primary transition-colors hover:bg-accent-soft disabled:opacity-50"
          >
            {props.cancelLabel}
          </button>
          <button
            type="submit"
            disabled={props.disabled || props.pending}
            className={`min-h-btn cursor-pointer rounded-2xl px-5 text-button-primary font-semibold text-on-accent shadow-stitch-sm disabled:opacity-45 ${props.danger ? 'bg-danger' : 'bg-accent hover:bg-accent-hover'}`}
          >
            {props.pending ? 'Đang xử lý…' : props.confirmLabel}
          </button>
        </footer>
      </form>
    </ModalDialog>
  );
}
