import type { useNewPainIssueSheet } from './useNewPainIssueSheet';
export function NewPainIssueFooter({ state }: { state: ReturnType<typeof useNewPainIssueSheet> }) {
  return (
    <footer className="shrink-0 border-t border-border bg-surface p-4">
      {state.step === 1 ? (
        <button
          type="button"
          disabled={!state.selected || state.pending}
          onClick={() => state.setStep(2)}
          className="min-h-[52px] w-full rounded-xl bg-accent px-5 font-medium text-white disabled:opacity-50"
        >
          Tiếp tục
        </button>
      ) : (
        <button
          type="submit"
          disabled={state.values.level === null || state.pending}
          className="min-h-[52px] w-full rounded-xl bg-accent px-5 font-medium text-white disabled:opacity-50"
        >
          {state.pending ? 'Đang lưu…' : 'Lưu vấn đề đau'}
        </button>
      )}
    </footer>
  );
}
