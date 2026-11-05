import type { PrivacyEdits } from '@angia/contracts';
import type { PrivacyEditorState } from './privacyEditorState';
const fullCrop = () => ({ left: 0, top: 0, width: 1_000_000, height: 1_000_000 });
// Mở lại ảnh đã che (trước khi gửi) thì bắt đầu từ vùng đã dùng để xuất.
export function initialPrivacyEditor(edits?: PrivacyEdits | null): PrivacyEditorState {
  return { edits: edits ?? { rotation: 0, crop: fullCrop(), masks: [] }, history: [] };
}
