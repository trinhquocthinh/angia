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
  | { type: 'remove-mask'; index: number }
  | { type: 'add-masks'; rectangles: PrivacyRectangle[] };
/** Trần vùng che của PrivacyEdits (SPEC-008). */
export const MAX_MASKS = 32;
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
      return state.edits.masks.length >= MAX_MASKS
        ? state
        : changeEdits(state, { ...state.edits, masks: [...state.edits.masks, action.rectangle] });
    case 'add-masks': {
      // SPEC-083: gợi ý chỉ được thêm, không thay vùng người dùng đã vẽ; phần vượt trần bỏ.
      const room = action.rectangles.slice(0, MAX_MASKS - state.edits.masks.length);
      return room.length
        ? changeEdits(state, { ...state.edits, masks: [...state.edits.masks, ...room] })
        : state;
    }
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
