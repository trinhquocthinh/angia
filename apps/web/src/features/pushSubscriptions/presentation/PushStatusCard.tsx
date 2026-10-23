import type { PushStateView } from '../application/describePushState';
import { PushIcon } from './PushIcon';
import { PushStatePill } from './PushStatePill';

// Thẻ trạng thái bản desktop: nhãn trạng thái thật + làm mới cấu hình từ máy chủ.
export function PushStatusCard({
  state,
  refreshing,
  onRefresh,
}: {
  state: PushStateView;
  refreshing: boolean;
  onRefresh(): void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[20px] bg-white p-5 shadow-[0_1px_2px_#1f2a2a0f]">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#aef0da] text-[#004135]">
        <PushIcon name="ring" size={26} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-['Newsreader',Georgia,serif] text-xl font-semibold text-[#004135]">
            Trạng thái thiết bị
          </p>
          <PushStatePill state={state} />
        </div>
        <p className="mt-1 text-sm text-[#404945]">{state.detail}</p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-[#286958] hover:bg-[#e4f0f0] disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-[#286958]"
      >
        <PushIcon name="refresh" size={18} /> Làm mới
      </button>
    </div>
  );
}
