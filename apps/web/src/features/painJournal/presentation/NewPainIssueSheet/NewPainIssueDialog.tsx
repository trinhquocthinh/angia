import './newPainIssue.css';
import { NewPainIssueFooter } from './NewPainIssueFooter';
import { useEffect, useId, useRef } from 'react';
import { ModalDialog } from '@src/shared/ui/ModalDialog';
import { NewPainIssueRegionStep } from './NewPainIssueRegionStep';
import { NewPainIssueEntryStep } from './NewPainIssueEntryStep';
import { useNewPainIssueSheet } from './useNewPainIssueSheet';
import type { NewPainIssueSheetProps } from './newPainIssueTypes';
export function NewPainIssueDialog(props: NewPainIssueSheetProps) {
  const state = useNewPainIssueSheet(props);
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [state.step]);
  return (
    <ModalDialog labelledBy={id} onCancel={props.onClose} pending={state.pending} width="xl">
      <header
        data-new-pain-issue
        className="flex items-center justify-between gap-3 border-b border-border px-5 py-3"
      >
        <h2 ref={heading} tabIndex={-1} id={id} className="text-xl font-semibold">
          Thêm vấn đề đau — {state.step === 1 ? 'Chọn vùng' : 'Lần ghi đầu'}
        </h2>
        <button type="button" disabled={state.pending} onClick={props.onClose} className="min-h-11 px-3">
          Đóng
        </button>
      </header>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void state.submit();
        }}
        className="flex min-h-0 flex-col"
      >
        <fieldset disabled={state.pending} className="min-h-0 overflow-y-auto p-5" aria-busy={state.pending}>
          {state.step === 1 ? (
            <NewPainIssueRegionStep selected={state.selected} onSelect={state.select} issues={props.issues} />
          ) : (
            state.selected && (
              <NewPainIssueEntryStep
                selected={state.selected}
                onSelect={state.select}
                values={state.values}
                onChange={state.change}
                onChangeRegion={() => state.setStep(1)}
              />
            )
          )}
          {state.error && (
            <p role="alert" className="mt-3 text-sm">
              {state.error}
            </p>
          )}
        </fieldset>
        <NewPainIssueFooter state={state} />
      </form>
    </ModalDialog>
  );
}
