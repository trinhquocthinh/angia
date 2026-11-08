import { useId } from 'react';
import { ModalDialog } from '@src/shared/ui/ModalDialog';
import { describeBodyLocation } from '../BodyMap2D/describeBodyLocation';
import { FirstPainEntryFields } from '../NewPainIssueSheet/FirstPainEntryFields';
import { QuickPainEntryFooter } from './QuickPainEntryFooter';
import { useQuickPainEntrySheet } from './useQuickPainEntrySheet';
import type { QuickPainEntryProps } from './quickPainEntryTypes';

export function QuickPainEntryDialog(props: QuickPainEntryProps) {
  const id = useId();
  const state = useQuickPainEntrySheet(props);
  return (
    <ModalDialog labelledBy={id} onCancel={props.onClose} pending={state.pending} width="lg">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3">
        <h2 id={id} className="text-xl font-semibold">
          Ghi mức · {describeBodyLocation(props.issue)}
        </h2>
        <button type="button" disabled={state.pending} onClick={props.onClose} className="min-h-11 px-3">
          Đóng
        </button>
      </header>
      <form
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        onSubmit={(event) => {
          event.preventDefault();
          void state.submit(state.needsReopen);
        }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
          <fieldset disabled={state.pending} aria-busy={state.pending} className="min-w-0">
            {props.message && (
              <p role="status" className="mb-3">
                {props.message}
              </p>
            )}
            <FirstPainEntryFields values={state.values} onChange={state.change} />
            {state.error && (
              <p role="alert" className="mt-3">
                {state.error}
              </p>
            )}
          </fieldset>
        </div>
        <QuickPainEntryFooter state={state} />
      </form>
    </ModalDialog>
  );
}
