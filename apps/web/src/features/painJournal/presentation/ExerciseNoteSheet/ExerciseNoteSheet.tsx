import { useId } from 'react';
import { ModalDialog } from '@src/shared/ui/ModalDialog';
import { ExerciseNoteFields } from './ExerciseNoteFields';
import { useExerciseNoteSheet, type ExerciseNoteSheetProps } from './useExerciseNoteSheet';
export function ExerciseNoteSheet(props: ExerciseNoteSheetProps) {
  const id = useId();
  const state = useExerciseNoteSheet(props);
  return (
    <ModalDialog labelledBy={id} onCancel={props.onClose} pending={state.pending} width="lg">
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 id={id} className="text-xl font-semibold">
          {props.exercise ? 'Sửa bài tập' : 'Thêm bài tập'}
        </h2>
        <button type="button" disabled={state.pending} onClick={props.onClose} className="min-h-11 px-3">
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
          <fieldset disabled={state.pending || !state.enabled} aria-busy={state.pending}>
            <ExerciseNoteFields values={state.values} onChange={state.change} />
            {state.error && (
              <p role="alert" className="mt-3">
                {state.error}
              </p>
            )}
          </fieldset>
        </div>
        <footer className="flex shrink-0 justify-end gap-3 border-t border-border bg-surface px-5 py-3">
          <button type="button" disabled={state.pending} onClick={props.onClose} className="min-h-11 px-3">
            Hủy
          </button>
          <button
            type="submit"
            disabled={state.pending || !state.enabled}
            className="min-h-11 rounded-lg bg-accent px-4 text-on-accent disabled:opacity-50"
          >
            {state.pending ? 'Đang lưu…' : props.exercise ? 'Lưu thay đổi' : 'Thêm bài tập'}
          </button>
        </footer>
      </form>
    </ModalDialog>
  );
}
