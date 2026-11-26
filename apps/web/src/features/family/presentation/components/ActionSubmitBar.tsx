export function ActionSubmitBar({
  remove,
  pending,
  onClose,
}: {
  remove: boolean;
  pending: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-3 border-t border-border/35 pt-4">
      <button
        type="button"
        className="inline-flex min-h-btn cursor-pointer items-center justify-center rounded-2xl border border-border/45 bg-bg px-5 text-button-secondary font-semibold text-text-primary transition-colors hover:bg-accent-soft"
        disabled={pending}
        onClick={onClose}
      >
        Hủy
      </button>
      <button
        type="submit"
        className={`inline-flex min-h-btn cursor-pointer items-center justify-center gap-2 rounded-2xl border-0 px-5 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors ${remove ? 'bg-danger enabled:hover:bg-danger/90' : 'bg-accent enabled:hover:bg-accent-hover'}`}
        disabled={pending}
      >
        {pending ? (
          <>
            <span
              className="size-4 rounded-full border-2 border-surface/33 border-t-on-accent animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            Đang lưu...
          </>
        ) : remove ? (
          'Xác nhận gỡ'
        ) : (
          'Lưu thay đổi'
        )}
      </button>
    </div>
  );
}
