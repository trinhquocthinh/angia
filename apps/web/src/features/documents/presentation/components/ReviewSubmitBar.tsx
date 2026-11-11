import { DocumentIcon } from './DocumentIcon';

// Thanh "Lưu vào sổ": dính ngay trên thanh điều hướng đáy trên di động, nằm cuối form trên desktop (Enter cũng lưu).
export function ReviewSubmitBar({ pending, disabled }: { pending: boolean; disabled: boolean }) {
  return (
    <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 -mx-4 flex flex-col gap-2 bg-bg/90 px-4 py-3 backdrop-blur-md lg:static lg:mx-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
      <button
        type="submit"
        disabled={pending || disabled}
        className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-on-accent shadow-[0_4px_16px_color-mix(in_srgb,var(--color-shadow)_25%,transparent)] transition-[background-color,box-shadow,opacity,scale] duration-200 enabled:cursor-pointer enabled:hover:bg-accent-hover enabled:active:scale-[0.98] disabled:cursor-default disabled:opacity-55 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus motion-reduce:transition-none motion-reduce:enabled:active:scale-100"
      >
        {pending ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-on-accent/30 border-t-on-accent motion-reduce:animate-none"
          />
        ) : (
          <DocumentIcon name="check" size={18} />
        )}
        {pending ? 'Đang lưu…' : 'Lưu vào sổ'}
      </button>
      <p className="hidden items-center justify-center gap-1 text-xs text-text-secondary lg:flex">
        Nhấn <kbd className="rounded bg-border px-1.5 py-0.5 font-mono text-[11px]">Enter</kbd> để lưu
      </p>
    </div>
  );
}
