import type { PrivacyEditorState } from './privacyEditorState';
const fullCrop = () => ({ left: 0, top: 0, width: 1_000_000, height: 1_000_000 });
export function initialPrivacyEditor(): PrivacyEditorState {
  return {
    edits: { rotation: 0, crop: fullCrop(), masks: [] },
    revision: 0,
    candidate: { state: 'none' },
    candidateRevision: 0,
    loaded: null,
    checked: false,
    history: [],
  };
}
