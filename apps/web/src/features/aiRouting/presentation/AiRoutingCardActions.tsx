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
        <p role="status" className="m-0 text-[12px] text-[#286958]">
          Đã lưu cấu hình.
        </p>
      )}
      {state.config.data && (
        <button
          type="button"
          disabled={disabled}
          onClick={panel.start}
          className="min-h-11 w-full rounded-xl border border-[#e4e0da] bg-white px-3 text-[13px] font-semibold text-[#131d1d] cursor-pointer hover:bg-[#e4f0f0] disabled:opacity-60"
        >
          Chỉnh cấu hình
        </button>
      )}
      {state.config.isError && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => void panel.reload()}
          className="min-h-11 rounded-xl border border-[#286958] bg-white px-3 text-[13px] text-[#286958] cursor-pointer disabled:opacity-60"
        >
          Tải lại cấu hình
        </button>
      )}
    </div>
  );
}
