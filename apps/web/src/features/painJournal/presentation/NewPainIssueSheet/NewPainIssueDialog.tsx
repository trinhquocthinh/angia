import './newPainIssue.css';
import { NewPainIssueFooter } from './NewPainIssueFooter';
import type { RefObject } from 'react';
import { useEffect, useId, useRef } from 'react';
import { ModalDialog } from '@src/shared/ui/ModalDialog';
import { NewPainIssueRegionStep } from './NewPainIssueRegionStep';
import { NewPainIssueEntryStep } from './NewPainIssueEntryStep';
import { useNewPainIssueSheet } from './useNewPainIssueSheet';
import type { NewPainIssueSheetProps } from './newPainIssueTypes';

function DialogHeader({
  heading,
  id,
  step,
  pending,
  onClose,
}: {
  heading: RefObject<HTMLHeadingElement | null>;
  id: string;
  step: 1 | 2;
  pending: boolean;
  onClose: () => void;
}) {
  return (
    <header
      data-new-pain-issue
      className="flex shrink-0 items-center justify-between gap-3 border-b border-border/35 px-5 py-4"
    >
      <h2
        ref={heading}
        tabIndex={-1}
        id={id}
        className="auth-heading text-heading-2 font-semibold text-accent"
      >
        Thêm vấn đề đau — {step === 1 ? 'Chọn vùng' : 'Lần ghi đầu'}
      </h2>
      <button
        type="button"
        disabled={pending}
        onClick={onClose}
        className="inline-flex min-h-11 cursor-pointer items-center rounded-2xl border border-border/45 bg-bg px-4 text-caption font-semibold text-text-secondary transition-colors hover:bg-accent-soft hover:text-accent disabled:opacity-50"
      >
        Đóng
      </button>
    </header>
  );
}

export function NewPainIssueDialog(props: NewPainIssueSheetProps) {
  const state = useNewPainIssueSheet(props);
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [state.step]);
  return (
    <ModalDialog labelledBy={id} onCancel={props.onClose} pending={state.pending} width="xl">
      <DialogHeader
        heading={heading}
        id={id}
        step={state.step}
        pending={state.pending}
        onClose={props.onClose}
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void state.submit();
        }}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
          <fieldset disabled={state.pending} className="min-w-0" aria-busy={state.pending}>
            {state.step === 1 ? (
              <NewPainIssueRegionStep
                selected={state.selected}
                onSelect={state.select}
                issues={props.issues}
              />
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
              <p role="alert" className="mt-3 text-body">
                {state.error}
              </p>
            )}
          </fieldset>
        </div>
        <NewPainIssueFooter state={state} />
      </form>
    </ModalDialog>
  );
}
