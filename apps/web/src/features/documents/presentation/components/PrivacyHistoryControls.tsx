import { PrivacyToolIcon } from './PrivacyToolIcon';
import type { PrivacyEditorAction } from '../../application/privacyEditorState';
type Props = {
  disabled: boolean;
  canUndo: boolean;
  setSelected: (index: number) => void;
  dispatch: (action: PrivacyEditorAction) => void;
};
const button =
  'flex min-h-11 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-semibold text-[#004135] disabled:opacity-40';
export function PrivacyHistoryControls({ disabled, canUndo, setSelected, dispatch }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={disabled}
        className={button}
        onClick={() => {
          dispatch({ type: 'rotate' });
          setSelected(-1);
        }}
      >
        <PrivacyToolIcon name="rotate" />
        Xoay 90°
      </button>
      <button
        type="button"
        disabled={disabled || !canUndo}
        className={button}
        onClick={() => dispatch({ type: 'undo' })}
      >
        <PrivacyToolIcon name="undo" />
        Hoàn tác
      </button>
    </div>
  );
}
