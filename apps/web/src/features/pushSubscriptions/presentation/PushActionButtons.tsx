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
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors disabled:cursor-default disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus';
// Di động: xếp dọc toàn chiều ngang; desktop: một hàng (chính · phụ · nhẹ).
export function PushActionButtons(props: Props) {
  return (
    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch lg:gap-3">
      <button
        className={`${base} min-h-[52px] bg-accent text-on-accent hover:bg-accent-hover`}
        disabled={props.busy || !props.supported || !props.enabled || props.registered}
        onClick={props.onEnable}
      >
        <PushIcon name="bell" /> Bật thông báo
      </button>
      <button
        className={`${base} min-h-12 bg-accent-soft text-accent hover:bg-accent-soft lg:min-h-[52px] lg:bg-accent-soft`}
        disabled={props.busy || !props.enabled || !props.registered}
        onClick={props.onTest}
      >
        <PushIcon name="send" /> Gửi thông báo thử
      </button>
      <button
        className={`${base} min-h-11 font-medium text-text-secondary hover:bg-danger-soft/40 hover:text-danger lg:min-h-[52px]`}
        disabled={props.busy || !props.loaded || !props.supported}
        onClick={props.onDisable}
      >
        <PushIcon name="bellOff" size={18} /> Tắt thông báo trên thiết bị này
      </button>
    </div>
  );
}
