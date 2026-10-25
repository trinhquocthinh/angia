type Props = {
  canSave: boolean;
  pending: boolean;
  cancelLabel: string;
  onSave: () => void;
  onCancel: () => void;
};

// Chân hộp thoại trùng tên: cố định dưới thân cuộn; mobile xếp dọc, nút lưu ở trên.
export function CourseConflictFooter({ canSave, pending, cancelLabel, onSave, onCancel }: Props) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-[#e4f0f0] bg-white px-6 py-4 max-md:flex-col-reverse max-md:items-stretch max-md:px-5 max-md:pb-[max(16px,env(safe-area-inset-bottom))]">
      <button
        type="button"
        disabled={pending}
        onClick={onCancel}
        className="min-h-12 rounded-xl bg-[#e4f0f0] px-5 font-semibold text-[#131d1d] transition-colors duration-200 hover:bg-[#deebea] disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958] motion-reduce:transition-none"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        disabled={pending || !canSave}
        onClick={onSave}
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#004135] px-5 font-semibold text-white shadow-[0_8px_20px_#00413533] transition-[background-color,transform,opacity] duration-200 hover:bg-[#20594b] active:scale-[0.98] disabled:opacity-45 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958] motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        {pending && (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
          />
        )}
        {pending ? 'Đang lưu…' : 'Lưu với lựa chọn này'}
      </button>
    </div>
  );
}
