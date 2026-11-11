import type { useEditPainEntrySheet } from './useEditPainEntrySheet';
export function EditPainEntryFooter({ state }: { state: ReturnType<typeof useEditPainEntrySheet> }) {
  return (
    <footer className="space-y-3 border-t border-border p-4">
      <button
        type="submit"
        disabled={state.pending || !state.enabled || state.values.level === null}
        className="min-h-[52px] w-full rounded-xl bg-accent px-4 text-on-accent disabled:opacity-50"
      >
        {state.pending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {!state.canDelete ? (
        <p className="text-sm">Đây là lần ghi duy nhất. Muốn bỏ hẳn, hãy xóa vấn đề.</p>
      ) : state.confirmDelete ? (
        <div className="space-y-2">
          <p>Xóa lần ghi này?</p>
          <button
            type="button"
            disabled={state.pending || !state.enabled}
            className="min-h-11 px-3 underline"
            onClick={() => {
              void state.remove();
            }}
          >
            {state.pending ? 'Đang xóa…' : 'Xác nhận xóa lần ghi'}
          </button>
          <button
            type="button"
            disabled={state.pending}
            className="min-h-11 px-3 underline"
            onClick={() => state.setConfirmDelete(false)}
          >
            Giữ lại
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={state.pending || !state.enabled}
          className="min-h-11 px-3 underline"
          onClick={() => state.setConfirmDelete(true)}
        >
          Xóa lần ghi
        </button>
      )}
    </footer>
  );
}
