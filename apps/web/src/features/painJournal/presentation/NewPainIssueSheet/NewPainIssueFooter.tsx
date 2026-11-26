import type { useNewPainIssueSheet } from './useNewPainIssueSheet';
export function NewPainIssueFooter({ state }: { state: ReturnType<typeof useNewPainIssueSheet> }) {
  return (
    <footer className="shrink-0 border-t border-border/35 bg-surface p-4">
      {state.step === 1 ? (
        <button
          type="button"
          disabled={!state.selected || state.pending}
          onClick={() => state.setStep(2)}
          className="min-h-btn w-full cursor-pointer rounded-2xl bg-accent px-5 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors hover:bg-accent-hover disabled:opacity-45"
        >
          Tiếp tục
        </button>
      ) : (
        <button
          type="submit"
          disabled={state.values.level === null || state.pending}
          className="min-h-btn w-full cursor-pointer rounded-2xl bg-accent px-5 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors hover:bg-accent-hover disabled:opacity-45"
        >
          {state.pending ? 'Đang lưu…' : 'Lưu vấn đề đau'}
        </button>
      )}
    </footer>
  );
}
