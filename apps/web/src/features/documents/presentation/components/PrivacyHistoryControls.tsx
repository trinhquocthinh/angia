import type { PrivacyEditorAction } from '../../application/privacyEditorState';
type Props = {
  disabled: boolean;
  canUndo: boolean;
  setSelected: (index: number) => void;
  dispatch: (action: PrivacyEditorAction) => void;
};
const button =
  'min-h-11 rounded-xl border border-[#d6e5df] bg-white px-3 text-sm font-medium text-[#004135] disabled:opacity-40';
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
        Xoay 90°
      </button>
      <button
        type="button"
        disabled={disabled || !canUndo}
        className={button}
        onClick={() => dispatch({ type: 'undo' })}
      >
        Hoàn tác
      </button>
    </div>
  );
}
