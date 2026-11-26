import type { useEditPainEntrySheet } from './useEditPainEntrySheet';
export function EditPainEntryFooter({ state }: { state: ReturnType<typeof useEditPainEntrySheet> }) {
  return (
    <footer className="space-y-3 border-t border-border/35 p-4">
      <button
        type="submit"
        disabled={state.pending || !state.enabled || state.values.level === null}
        className="min-h-btn w-full cursor-pointer rounded-2xl bg-accent px-5 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors hover:bg-accent-hover disabled:opacity-45"
      >
        {state.pending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {!state.canDelete ? (
        <p className="text-caption text-text-secondary">
          Đây là lần ghi duy nhất. Muốn bỏ hẳn, hãy xóa vấn đề.
        </p>
      ) : state.confirmDelete ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-danger-soft/70 p-3">
          <p className="w-full text-caption font-semibold text-danger">Xóa lần ghi này?</p>
          <button
            type="button"
            disabled={state.pending || !state.enabled}
            className="min-h-11 cursor-pointer rounded-2xl bg-danger px-4 text-caption font-semibold text-on-accent disabled:opacity-50"
            onClick={() => {
              void state.remove();
            }}
          >
            {state.pending ? 'Đang xóa…' : 'Xác nhận xóa lần ghi'}
          </button>
          <button
            type="button"
            disabled={state.pending}
            className="min-h-11 cursor-pointer rounded-2xl bg-surface px-4 text-caption font-semibold text-text-primary"
            onClick={() => state.setConfirmDelete(false)}
          >
            Giữ lại
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={state.pending || !state.enabled}
          className="min-h-11 cursor-pointer rounded-2xl bg-danger-soft/60 px-4 text-caption font-semibold text-danger transition-colors hover:bg-danger-soft disabled:opacity-50"
          onClick={() => state.setConfirmDelete(true)}
        >
          Xóa lần ghi
        </button>
      )}
    </footer>
  );
}
