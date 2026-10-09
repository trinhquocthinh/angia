import type { PrivacyEditorAction } from '../../application/privacyEditorState';
import { PrivacyToolIcon } from './PrivacyToolIcon';
type Props = {
  disabled: boolean;
  mode: 'crop' | 'mask';
  count: number;
  setMode: (mode: 'crop' | 'mask') => void;
  setSelected: (index: number) => void;
  dispatch: (action: PrivacyEditorAction) => void;
};
const button =
  'flex min-h-11 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-semibold text-[#004135] shadow-sm transition-colors aria-pressed:bg-[#004135] aria-pressed:text-white disabled:opacity-40';
export function PrivacyModeControls({ disabled, mode, count, setMode, setSelected, dispatch }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        aria-label="Cắt vùng nội dung"
        disabled={disabled}
        aria-pressed={mode === 'crop'}
        className={button}
        onClick={() => {
          setMode('crop');
          setSelected(-1);
        }}
      >
        <PrivacyToolIcon name="crop" />
        Cắt vùng nội dung
      </button>
      <button
        type="button"
        aria-label="Che thông tin"
        disabled={disabled}
        aria-pressed={mode === 'mask'}
        className={button}
        onClick={() => setMode('mask')}
      >
        <PrivacyToolIcon name="mask" />
        Che thông tin{mode === 'mask' ? ' (Đang chọn)' : ''}
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
        <PrivacyToolIcon name="add" />
        Thêm vùng che
      </button>
    </div>
  );
}
