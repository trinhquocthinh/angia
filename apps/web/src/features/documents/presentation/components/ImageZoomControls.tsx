import type { ViewMode } from '../../application/useImageViewport';

type ImageZoomControlsProps = {
  scale: number;
  mode: ViewMode;
  disabled: boolean;
  onFitPage: () => void;
  onFitWidth: () => void;
  onZoom: (factor: number) => void;
};

const STEP = 1.25;
const base =
  'inline-flex min-h-11 items-center justify-center rounded-xl px-2.5 text-[13px] font-medium sm:px-3 sm:text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958] disabled:opacity-50';
const tone = (active: boolean) => (active ? 'bg-[#004135] text-white' : 'bg-white text-[#004135]');

// Hai chế độ nhanh + phóng/thu từng nấc; 100% = vừa chiều ngang khung.
export function ImageZoomControls({
  scale,
  mode,
  disabled,
  onFitPage,
  onFitWidth,
  onZoom,
}: ImageZoomControlsProps) {
  return (
    <div
      role="toolbar"
      aria-label="Điều khiển xem ảnh"
      className="flex flex-wrap items-center gap-1.5 sm:gap-2"
    >
      {(
        [
          ['fit', 'Vừa khung', onFitPage],
          ['width', 'Vừa ngang', onFitWidth],
        ] as const
      ).map(([value, label, onClick]) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          disabled={disabled}
          onClick={onClick}
          className={`${base} ${tone(mode === value)}`}
        >
          {label}
        </button>
      ))}
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          aria-label="Thu nhỏ ảnh"
          disabled={disabled}
          onClick={() => onZoom(1 / STEP)}
          className={`${base} w-11 bg-white text-lg text-[#004135]`}
        >
          −
        </button>
        <output
          aria-live="polite"
          className="w-14 text-center text-xs font-semibold tabular-nums text-[#3f4946] max-sm:sr-only"
        >
          {Math.round(scale * 100)}%
        </output>
        <button
          type="button"
          aria-label="Phóng to ảnh"
          disabled={disabled}
          onClick={() => onZoom(STEP)}
          className={`${base} w-11 bg-white text-lg text-[#004135]`}
        >
          +
        </button>
      </div>
    </div>
  );
}
