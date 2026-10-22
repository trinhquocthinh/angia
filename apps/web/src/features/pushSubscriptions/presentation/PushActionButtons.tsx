import { PushIcon } from './PushIcon';

interface Props {
  busy: boolean;
  supported: boolean;
  enabled: boolean;
  registered: boolean;
  loaded: boolean;
  onEnable(): void;
  onTest(): void;
  onDisable(): void;
}
const base =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors disabled:cursor-default disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958]';
// Di động: xếp dọc toàn chiều ngang; desktop: một hàng (chính · phụ · nhẹ).
export function PushActionButtons(props: Props) {
  return (
    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch lg:gap-3">
      <button
        className={`${base} min-h-[52px] bg-[#004135] text-white hover:bg-[#20594b]`}
        disabled={props.busy || !props.supported || !props.enabled || props.registered}
        onClick={props.onEnable}
      >
        <PushIcon name="bell" /> Bật thông báo
      </button>
      <button
        className={`${base} min-h-12 bg-[#e4f0f0] text-[#004135] hover:bg-[#d4ebe6] lg:min-h-[52px] lg:bg-[#aef0da]`}
        disabled={props.busy || !props.enabled || !props.registered}
        onClick={props.onTest}
      >
        <PushIcon name="send" /> Gửi thông báo thử
      </button>
      <button
        className={`${base} min-h-11 font-medium text-[#707975] hover:bg-[#ffdad6]/40 hover:text-[#ba1a1a] lg:min-h-[52px]`}
        disabled={props.busy || !props.loaded || !props.supported}
        onClick={props.onDisable}
      >
        <PushIcon name="bellOff" size={18} /> Tắt thông báo trên thiết bị này
      </button>
    </div>
  );
}
