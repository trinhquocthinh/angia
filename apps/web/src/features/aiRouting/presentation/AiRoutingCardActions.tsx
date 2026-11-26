import type { useAiRouting } from '../application/useAiRouting';
import type { useAiRoutingPanel } from '../application/useAiRoutingPanel';

export function AiRoutingCardActions({
  state,
  panel,
  disabled,
}: {
  state: ReturnType<typeof useAiRouting>;
  panel: ReturnType<typeof useAiRoutingPanel>;
  disabled: boolean;
}) {
  return (
    <div className="grid gap-2">
      {state.save.isSuccess && (
        <p role="status" className="m-0 text-body text-accent">
          Đã lưu cấu hình.
        </p>
      )}
      {state.config.data && (
        <button
          type="button"
          disabled={disabled}
          onClick={panel.start}
          className="min-h-btn w-full cursor-pointer rounded-2xl border border-border/45 bg-bg px-4 text-button-secondary font-semibold text-accent transition-colors enabled:hover:bg-accent-soft disabled:opacity-60"
        >
          Chỉnh cấu hình
        </button>
      )}
      {state.config.isError && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => void panel.reload()}
          className="min-h-btn cursor-pointer rounded-2xl border border-accent bg-surface px-4 text-button-secondary font-semibold text-accent transition-colors enabled:hover:bg-accent-soft disabled:opacity-60"
        >
          Tải lại cấu hình
        </button>
      )}
    </div>
  );
}
