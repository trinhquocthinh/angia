import { useId } from 'react';
import { ModalDialog } from '@src/shared/ui/ModalDialog';
import { ExerciseNoteFields } from './ExerciseNoteFields';
import { useExerciseNoteSheet, type ExerciseNoteSheetProps } from './useExerciseNoteSheet';
export function ExerciseNoteSheet(props: ExerciseNoteSheetProps) {
  const id = useId();
  const state = useExerciseNoteSheet(props);
  return (
    <ModalDialog labelledBy={id} onCancel={props.onClose} pending={state.pending} width="lg">
      <header className="flex items-center justify-between border-b border-border/35 px-5 py-4">
        <h2 id={id} className="auth-heading text-heading-2 font-semibold text-accent">
          {props.exercise ? 'Sửa bài tập' : 'Thêm bài tập'}
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
        className="flex min-h-0 flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          void state.save();
        }}
      >
        <div className="min-h-0 overflow-y-auto p-5">
          <fieldset
            disabled={state.pending || !state.enabled}
            aria-busy={state.pending}
            className="border-0 p-0"
          >
            <ExerciseNoteFields values={state.values} onChange={state.change} />
            {state.error && (
              <p role="alert" className="mt-3 rounded-2xl bg-danger-soft p-3 text-body text-danger">
                {state.error}
              </p>
            )}
          </fieldset>
        </div>
        <footer className="flex shrink-0 justify-end gap-3 border-t border-border/35 bg-surface px-5 py-4">
          <button
            type="button"
            disabled={state.pending}
            onClick={props.onClose}
            className="min-h-btn cursor-pointer rounded-2xl border border-border/45 bg-bg px-5 text-button-secondary font-semibold text-text-primary transition-colors hover:bg-accent-soft disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={state.pending || !state.enabled}
            className="min-h-btn cursor-pointer rounded-2xl bg-accent px-5 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors hover:bg-accent-hover disabled:opacity-45"
          >
            {state.pending ? 'Đang lưu…' : props.exercise ? 'Lưu thay đổi' : 'Thêm bài tập'}
          </button>
        </footer>
      </form>
    </ModalDialog>
  );
}
