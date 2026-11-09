import type { useQuickPainEntrySheet } from './useQuickPainEntrySheet';
export function QuickPainEntryFooter({ state }: { state: ReturnType<typeof useQuickPainEntrySheet> }) {
  return (
    <footer className="shrink-0 border-t border-border bg-surface p-4">
      {state.existingIssueId ? (
        <button
          type="button"
          className="min-h-[52px] w-full underline"
          disabled={state.pending}
          onClick={state.continueExisting}
        >
          Mở vấn đề đó
        </button>
      ) : (
        <button
          type="submit"
          disabled={state.values.level === null || state.pending || !state.enabled}
          className="min-h-[52px] w-full rounded-xl bg-accent px-5 font-medium text-white disabled:opacity-50"
        >
          {state.pending ? 'Đang lưu…' : state.needsReopen ? 'Mở lại và ghi' : 'Lưu'}
        </button>
      )}
    </footer>
  );
}
