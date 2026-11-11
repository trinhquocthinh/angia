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
      <h2 id={id} className="border-b border-border px-5 py-4 text-xl font-semibold">
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
          {props.error && <p role="alert">{props.error}</p>}
        </div>
        <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-border bg-surface p-4">
          <button
            type="button"
            disabled={props.pending}
            onClick={props.onClose}
            className="min-h-[52px] px-3"
          >
            {props.cancelLabel}
          </button>
          <button
            type="submit"
            disabled={props.disabled || props.pending}
            className={`min-h-[52px] rounded-xl px-4 text-on-accent disabled:opacity-50 ${props.danger ? 'bg-danger' : 'bg-accent'}`}
          >
            {props.pending ? 'Đang xử lý…' : props.confirmLabel}
          </button>
        </footer>
      </form>
    </ModalDialog>
  );
}
