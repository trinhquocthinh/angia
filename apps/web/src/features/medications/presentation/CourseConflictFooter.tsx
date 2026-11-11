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
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border bg-surface px-6 py-4 max-md:flex-col-reverse max-md:items-stretch max-md:px-5 max-md:pb-[max(16px,env(safe-area-inset-bottom))]">
      <button
        type="button"
        disabled={pending}
        onClick={onCancel}
        className="min-h-12 rounded-xl bg-accent-soft px-5 font-semibold text-text-primary transition-colors duration-200 hover:bg-border disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        disabled={pending || !canSave}
        onClick={onSave}
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 font-semibold text-on-accent shadow-[0_8px_20px_color-mix(in_srgb,var(--color-shadow)_20%,transparent)] transition-[background-color,transform,opacity] duration-200 hover:bg-accent-hover active:scale-[0.98] disabled:opacity-45 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        {pending && (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-on-accent/40 border-t-on-accent motion-reduce:animate-none"
          />
        )}
        {pending ? 'Đang lưu…' : 'Lưu với lựa chọn này'}
      </button>
    </div>
  );
}
