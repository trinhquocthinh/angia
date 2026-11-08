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
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 id={id} className="text-xl font-semibold">
          Sửa lần ghi
        </h2>
        <button type="button" disabled={state.pending} onClick={props.onClose} className="min-h-11 px-3">
          Đóng
        </button>
      </header>
      <form
        className="flex min-h-0 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          void state.save();
        }}
      >
        <fieldset disabled={state.pending} aria-busy={state.pending} className="min-h-0 overflow-y-auto p-5">
          <FirstPainEntryFields values={state.values} onChange={state.change} />
          {state.error && (
            <p role="alert" className="mt-3">
              {state.error}
            </p>
          )}
        </fieldset>
        <EditPainEntryFooter state={state} />
      </form>
    </ModalDialog>
  );
}
