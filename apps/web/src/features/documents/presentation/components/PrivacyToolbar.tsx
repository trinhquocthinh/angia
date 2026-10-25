import type { PrivacyEditorAction, PrivacyEditorState } from '../../application/privacyEditorState';
import { PrivacyModeControls } from './PrivacyModeControls';
import { PrivacyHistoryControls } from './PrivacyHistoryControls';
type Props = {
  disabled: boolean;
  mode: 'crop' | 'mask';
  state: PrivacyEditorState;
  setMode: (mode: 'crop' | 'mask') => void;
  setSelected: (index: number) => void;
  dispatch: (action: PrivacyEditorAction) => void;
};
export function PrivacyToolbar({ disabled, mode, state, setMode, setSelected, dispatch }: Props) {
  return (
    <div
      aria-label="Công cụ cắt và che"
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#e4f0f0] p-2"
    >
      <PrivacyModeControls
        disabled={disabled}
        mode={mode}
        count={state.edits.masks.length}
        setMode={setMode}
        setSelected={setSelected}
        dispatch={dispatch}
      />
      <PrivacyHistoryControls
        disabled={disabled}
        canUndo={Boolean(state.history.length)}
        setSelected={setSelected}
        dispatch={dispatch}
      />
    </div>
  );
}
