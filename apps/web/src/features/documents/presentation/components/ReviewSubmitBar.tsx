import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

// Thanh "Lưu vào sổ" theo Stitch bb3e9ab1 / 6f8ab883: thẻ kính mờ dính đáy, nút chính nổi bật + phím tắt Enter.
export function ReviewSubmitBar({ pending, disabled }: { pending: boolean; disabled: boolean }) {
  return (
    <div className="doc-submit-dock sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex flex-col gap-2.5 p-3.5 lg:bottom-4 lg:p-4">
      <button
        type="submit"
        disabled={pending || disabled}
        className="inline-flex min-h-btn w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-button-primary font-semibold text-on-accent transition-[background-color,box-shadow,opacity,scale] duration-200 enabled:cursor-pointer enabled:hover:bg-accent-hover enabled:active:scale-[0.98] disabled:cursor-default disabled:opacity-55 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus motion-reduce:transition-none motion-reduce:enabled:active:scale-100"
      >
        {pending ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-on-accent/30 border-t-on-accent motion-reduce:animate-none"
          />
        ) : (
          <AdminIcon name="check_circle" size={20} />
        )}
        {pending ? 'Đang lưu…' : 'Lưu vào sổ'}
      </button>
      <p className="hidden items-center justify-center gap-1.5 text-caption text-text-secondary lg:flex">
        Nhấn{' '}
        <kbd className="rounded-md bg-surface-container px-2 py-0.5 font-mono text-caption font-semibold text-text-primary">
          Enter
        </kbd>{' '}
        để lưu
      </p>
    </div>
  );
}
