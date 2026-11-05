import { initialPrivacyEditor } from './initialPrivacyEditor';
import type { PrivacyEdits, PrivacyRectangle } from '@angia/contracts';
export type PrivacyEditorState = {
  edits: PrivacyEdits;
  history: PrivacyEdits[];
};
export type PrivacyEditorAction =
  | { type: 'reset' | 'rotate' | 'undo' }
  | { type: 'crop' | 'mask'; rectangle: PrivacyRectangle }
  | { type: 'set-mask'; index: number; rectangle: PrivacyRectangle }
  | { type: 'remove-mask'; index: number };
const fullCrop = (): PrivacyRectangle => ({ left: 0, top: 0, width: 1_000_000, height: 1_000_000 });
function changeEdits(
  state: PrivacyEditorState,
  edits: PrivacyEdits,
  history = [...state.history.slice(-49), state.edits],
): PrivacyEditorState {
  return { edits, history };
}
export function privacyEditorReducer(
  state: PrivacyEditorState,
  action: PrivacyEditorAction,
): PrivacyEditorState {
  switch (action.type) {
    case 'reset':
      return initialPrivacyEditor();
    case 'crop':
      return changeEdits(state, { ...state.edits, crop: action.rectangle });
    case 'mask':
      return state.edits.masks.length >= 32
        ? state
        : changeEdits(state, { ...state.edits, masks: [...state.edits.masks, action.rectangle] });
    case 'set-mask':
      return changeEdits(state, {
        ...state.edits,
        masks: state.edits.masks.map((mask, index) => (index === action.index ? action.rectangle : mask)),
      });
    case 'remove-mask':
      return changeEdits(state, {
        ...state.edits,
        masks: state.edits.masks.filter((_, index) => index !== action.index),
      });
    case 'rotate':
      return changeEdits(state, {
        rotation: ((state.edits.rotation + 90) % 360) as PrivacyEdits['rotation'],
        crop: fullCrop(),
        masks: [],
      });
    case 'undo':
      return state.history.length
        ? changeEdits(state, state.history[state.history.length - 1]!, state.history.slice(0, -1))
        : state;
  }
}
