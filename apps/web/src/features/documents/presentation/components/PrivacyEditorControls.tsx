import { useState } from 'react';
import type { ReactNode } from 'react';
import type { PrivacyEditorState, PrivacyEditorAction } from '../../application/privacyEditorState';
import { PrivacyRectangleFields } from './PrivacyRectangleFields';
import { PrivacyToolbar } from './PrivacyToolbar';
import { PrivacyRegionSelector } from './PrivacyRegionSelector';
type Props = {
  state: PrivacyEditorState;
  disabled: boolean;
  historyLocked: boolean;
  mode: 'crop' | 'mask';
  setMode: (mode: 'crop' | 'mask') => void;
  dispatch: (action: PrivacyEditorAction) => void;
  onInputPending: (pending: boolean) => void;
  children: (toolbar: ReactNode, fields: ReactNode) => ReactNode;
};
export function PrivacyEditorControls(props: Props) {
  const { state, disabled, historyLocked, mode, setMode, dispatch, onInputPending, children } = props;
  const [selected, setSelected] = useState(-1);
  const [reset, setReset] = useState(0);
  const index = selected < state.edits.masks.length ? selected : -1;
  const rectangle = index < 0 ? state.edits.crop : state.edits.masks[index]!;
  const select = (value: number) => {
    onInputPending(false);
    setReset((value) => value + 1);
    setSelected(value);
  };
  const control = (action: PrivacyEditorAction) => {
    onInputPending(false);
    setReset((value) => value + 1);
    dispatch(action);
  };
  const toolbar = (
    <PrivacyToolbar
      disabled={disabled}
      historyLocked={historyLocked}
      mode={mode}
      state={state}
      setMode={setMode}
      setSelected={select}
      dispatch={control}
    />
  );
  const fields = (
    <div className="flex flex-col gap-3">
      <PrivacyRegionSelector
        disabled={disabled}
        count={state.edits.masks.length}
        index={index}
        setSelected={select}
        dispatch={control}
      />
      <PrivacyRectangleFields
        key={`${reset}:${index}:${state.edits.rotation}:${Object.values(rectangle).join(':')}`}
        kind={index < 0 ? 'crop' : 'mask'}
        onPendingChange={onInputPending}
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
  return children(toolbar, fields);
}
