import type { ViewMode } from '../../application/useImageViewport';
import { DocumentIcon } from './DocumentIcon';

type ImageZoomControlsProps = {
  scale: number;
  mode: ViewMode;
  disabled: boolean;
  onFitPage: () => void;
  onFitWidth: () => void;
  onZoom: (factor: number) => void;
  onRotate: () => void;
};

const STEP = 1.25;
const base =
  'inline-flex min-h-11 items-center justify-center rounded-xl px-2.5 text-[13px] font-medium transition-[background-color,color,scale] duration-200 enabled:cursor-pointer enabled:active:scale-95 motion-reduce:transition-none sm:px-3 sm:text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958] disabled:opacity-50';
const tone = (active: boolean) =>
  active ? 'bg-[#004135] text-white' : 'text-[#004135] enabled:hover:bg-[#deebea]';

type FitModesProps = Pick<ImageZoomControlsProps, 'mode' | 'disabled' | 'onFitPage' | 'onFitWidth'>;

function FitModes({ mode, disabled, onFitPage, onFitWidth }: FitModesProps) {
  const modes = [
    ['fit', 'Vừa khung', onFitPage],
    ['width', 'Vừa ngang', onFitWidth],
  ] as const;
  return (
    <div className="flex rounded-xl bg-[#eaf6f5]">
      {modes.map(([value, label, onClick]) => (
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
    </div>
  );
}

// Hai chế độ nhanh + phóng/thu từng nấc; 100% = vừa chiều ngang khung.
export function ImageZoomControls({
  scale,
  mode,
  disabled,
  onFitPage,
  onFitWidth,
  onZoom,
  onRotate,
}: ImageZoomControlsProps) {
  return (
    <div role="toolbar" aria-label="Điều khiển xem ảnh" className="flex flex-wrap items-center gap-1.5">
      <FitModes mode={mode} disabled={disabled} onFitPage={onFitPage} onFitWidth={onFitWidth} />
      <div className="ml-auto flex items-center rounded-xl bg-[#eaf6f5]">
        <button
          type="button"
          aria-label="Thu nhỏ ảnh"
          disabled={disabled}
          onClick={() => onZoom(1 / STEP)}
          className={`${base} w-11 text-lg text-[#004135] enabled:hover:bg-[#deebea]`}
        >
          −
        </button>
        <output
          aria-live="polite"
          className="w-11 text-center text-xs font-semibold tabular-nums text-[#3f4946] max-sm:sr-only"
        >
          {Math.round(scale * 100)}%
        </output>
        <button
          type="button"
          aria-label="Phóng to ảnh"
          disabled={disabled}
          onClick={() => onZoom(STEP)}
          className={`${base} w-11 text-lg text-[#004135] enabled:hover:bg-[#deebea]`}
        >
          +
        </button>
        <button
          type="button"
          aria-label="Xoay ảnh"
          disabled={disabled}
          onClick={onRotate}
          className={`${base} w-11 text-[#004135] enabled:hover:bg-[#deebea]`}
        >
          <DocumentIcon name="rotate" size={18} />
        </button>
      </div>
    </div>
  );
}
