import { PrivacyToolIcon } from './PrivacyToolIcon';
import type { PrivacyEditorAction } from '../../application/privacyEditorState';

type Props = {
  disabled: boolean;
  canUndo: boolean;
  setSelected: (index: number) => void;
  dispatch: (action: PrivacyEditorAction) => void;
};

export function PrivacyHistoryControls({ disabled, canUndo, setSelected, dispatch }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={disabled}
        className="privacy-tool-btn"
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
        className="privacy-tool-btn"
        onClick={() => dispatch({ type: 'undo' })}
      >
        <PrivacyToolIcon name="undo" />
        Hoàn tác
      </button>
    </div>
  );
}
