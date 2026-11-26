import { useId } from 'react';
import { ModalDialog } from '@src/shared/ui/ModalDialog';
import { FirstPainEntryFields } from '../NewPainIssueSheet/FirstPainEntryFields';
import { useEditPainEntrySheet, type EditPainEntryProps } from './useEditPainEntrySheet';
import { EditPainEntryFooter } from './EditPainEntryFooter';
export function EditPainEntrySheet(props: EditPainEntryProps) {
  const id = useId();
  const state = useEditPainEntrySheet(props);
  return (
    <ModalDialog labelledBy={id} onCancel={props.onClose} pending={state.pending} width="lg">
      <header className="flex shrink-0 items-center justify-between border-b border-border/35 px-5 py-4">
        <h2 id={id} className="auth-heading text-heading-2 font-semibold text-accent">
          Sửa lần ghi
        </h2>
        <button
          type="button"
          disabled={state.pending}
          onClick={props.onClose}
          className="inline-flex min-h-11 cursor-pointer items-center rounded-2xl border border-border/45 bg-bg px-4 text-caption font-semibold text-text-secondary transition-colors hover:bg-accent-soft hover:text-accent disabled:opacity-50"
        >
          Đóng
        </button>
      </header>
      <form
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        onSubmit={(event) => {
          event.preventDefault();
          void state.save();
        }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
          <fieldset disabled={state.pending} aria-busy={state.pending} className="min-w-0">
            <FirstPainEntryFields values={state.values} onChange={state.change} />
            {state.error && (
              <p role="alert" className="mt-3">
                {state.error}
              </p>
            )}
          </fieldset>
        </div>
        <EditPainEntryFooter state={state} />
      </form>
    </ModalDialog>
  );
}
