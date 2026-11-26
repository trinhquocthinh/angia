import type { useQuickPainEntrySheet } from './useQuickPainEntrySheet';
export function QuickPainEntryFooter({ state }: { state: ReturnType<typeof useQuickPainEntrySheet> }) {
  return (
    <footer className="shrink-0 border-t border-border/35 bg-surface pt-4">
      {state.existingIssueId ? (
        <button
          type="button"
          className="min-h-btn w-full cursor-pointer rounded-2xl border border-border/45 bg-bg px-5 text-button-secondary font-semibold text-accent transition-colors hover:bg-accent-soft"
          disabled={state.pending}
          onClick={state.continueExisting}
        >
          Mở vấn đề đó
        </button>
      ) : (
        <button
          type="submit"
          disabled={state.values.level === null || state.pending || !state.enabled}
          className="min-h-btn w-full cursor-pointer rounded-2xl bg-accent px-5 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors hover:bg-accent-hover disabled:opacity-45"
        >
          {state.pending ? 'Đang lưu…' : state.needsReopen ? 'Mở lại và ghi' : 'Lưu'}
        </button>
      )}
    </footer>
  );
}
