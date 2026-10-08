import { useState } from 'react';
import type { PrivacyEditorState, PrivacyEditorAction } from '../../application/privacyEditorState';
import { PrivacyRectangleFields } from './PrivacyRectangleFields';
import { PrivacyModeControls } from './PrivacyModeControls';
import { PrivacyHistoryControls } from './PrivacyHistoryControls';
import { PrivacyRegionSelector } from './PrivacyRegionSelector';
type Props = {
  state: PrivacyEditorState;
  disabled: boolean;
  mode: 'crop' | 'mask';
  setMode: (mode: 'crop' | 'mask') => void;
  dispatch: (action: PrivacyEditorAction) => void;
};
export function PrivacyEditorControls({ state, disabled, mode, setMode, dispatch }: Props) {
  const [selected, setSelected] = useState(-1);
  const count = state.edits.masks.length;
  const index = selected < count ? selected : -1;
  const rectangle = index < 0 ? state.edits.crop : state.edits.masks[index]!;
  return (
    <div className="flex flex-col gap-3">
      <PrivacyModeControls
        disabled={disabled}
        mode={mode}
        count={count}
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
      <p className="text-xs leading-5 text-[#55615f]">
        Kéo trên ảnh để cắt hoặc che. Xoay ảnh sẽ đặt lại toàn bộ vùng cắt và vùng che. Có thể hoàn tác hoặc
        dùng các ô số bên dưới.
      </p>
      <PrivacyRegionSelector
        disabled={disabled}
        count={count}
        index={index}
        setSelected={setSelected}
        dispatch={dispatch}
      />
      <PrivacyRectangleFields
        label={index < 0 ? 'Vùng cắt' : `Vùng che ${index + 1}`}
        rectangle={rectangle}
        disabled={disabled}
        onChange={(rect) =>
          dispatch(
            index < 0 ? { type: 'crop', rectangle: rect } : { type: 'set-mask', index, rectangle: rect },
          )
        }
      />
    </div>
  );
}
