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
const button = 'min-h-11 rounded-xl bg-[#004135] px-4 py-3 text-white disabled:opacity-50';
export function PushActionButtons(props: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        className={button}
        disabled={props.busy || !props.supported || !props.enabled || props.registered}
        onClick={props.onEnable}
      >
        Bật thông báo
      </button>
      <button
        className={button}
        disabled={props.busy || !props.enabled || !props.registered}
        onClick={props.onTest}
      >
        Gửi thông báo thử
      </button>
      <button
        className={button}
        disabled={props.busy || !props.loaded || !props.supported}
        onClick={props.onDisable}
      >
        Tắt thông báo trên thiết bị này
      </button>
    </div>
  );
}
