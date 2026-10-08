import type { PrivacyEditorAction } from '../../application/privacyEditorState';
type Props = {
  disabled: boolean;
  mode: 'crop' | 'mask';
  count: number;
  setMode: (mode: 'crop' | 'mask') => void;
  setSelected: (index: number) => void;
  dispatch: (action: PrivacyEditorAction) => void;
};
const button =
  'min-h-11 rounded-xl border border-[#d6e5df] bg-white px-3 text-sm font-medium text-[#004135] disabled:opacity-40';
export function PrivacyModeControls({ disabled, mode, count, setMode, setSelected, dispatch }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={disabled}
        aria-pressed={mode === 'crop'}
        className={button}
        onClick={() => {
          setMode('crop');
          setSelected(-1);
        }}
      >
        Cắt vùng nội dung
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={mode === 'mask'}
        className={button}
        onClick={() => setMode('mask')}
      >
        Che thông tin
      </button>
      <button
        type="button"
        disabled={disabled || count >= 32}
        className={button}
        onClick={() => {
          dispatch({ type: 'mask', rectangle: { left: 400000, top: 400000, width: 200000, height: 200000 } });
          setSelected(count);
        }}
      >
        Thêm vùng che
      </button>
    </div>
  );
}
