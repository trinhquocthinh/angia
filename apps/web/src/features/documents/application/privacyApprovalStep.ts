import { canApprovePrivacy } from './canApprovePrivacy';
import type { PrivacyEditorState } from './privacyEditorState';

export type PrivacyApprovalStep = 'blocked' | 'confirm-no-mask' | 'approve';

// BR-041 bổ sung 2026-10-12: bản kiểm tra không có vùng che nào thì hỏi lại trước khi gửi AI. Chỉ là lời
// nhắc — hệ thống không tự phát hiện định danh trong ảnh. Bản hợp lệ luôn khớp `edits` hiện tại.
export function privacyApprovalStep(
  state: PrivacyEditorState,
  acknowledgedNoMask: boolean,
): PrivacyApprovalStep {
  if (!canApprovePrivacy(state)) return 'blocked';
  return state.edits.masks.length === 0 && !acknowledgedNoMask ? 'confirm-no-mask' : 'approve';
}
