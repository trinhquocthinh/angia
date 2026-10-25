export function PushToggle({
  checked,
  disabled,
  onToggle,
}: {
  checked: boolean;
  disabled: boolean;
  onToggle(): void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Nhận thông báo trên thiết bị này"
      disabled={disabled}
      onClick={onToggle}
      className="group flex min-h-11 min-w-12 shrink-0 items-center justify-center disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-[#286958]"
    >
      <span className="relative h-7 w-12 rounded-full bg-[#d9e5e4] transition-colors group-aria-checked:bg-[#004135]">
        <span className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform group-aria-checked:translate-x-5 motion-reduce:transition-none" />
      </span>
    </button>
  );
}
