import { describe, expect, it } from 'vitest';
import { initialPrivacyEditor } from './initialPrivacyEditor';
import { privacyApprovalStep } from './privacyApprovalStep';
import { privacyEditorReducer } from './privacyEditorState';

const ready = { state: 'ready' as const, draftId: 'd', sha256: 'a'.repeat(64), imageUrl: '/api/image.png' };
const mask = { left: 0, top: 0, width: 100_000, height: 50_000 };
// Bản kiểm tra đã tải, đã tích xác nhận; `masks` là vùng che trong đúng bản đó.
function approvable(masks: (typeof mask)[]) {
  let state = initialPrivacyEditor();
  for (const rectangle of masks) state = privacyEditorReducer(state, { type: 'mask', rectangle });
  state = privacyEditorReducer(state, { type: 'remote', draft: ready, revision: state.revision });
  state = privacyEditorReducer(state, { type: 'loaded', draftId: 'd', sha256: ready.sha256 });
  return privacyEditorReducer(state, { type: 'check', checked: true });
}

describe('Bước xác nhận gửi AI — nhắc che định danh (BR-041 bổ sung 2026-10-12)', () => {
  it('TC-245: không có vùng che → hỏi lại trước khi gửi; đã trả lời "vẫn gửi" mới gửi', () => {
    expect(privacyApprovalStep(approvable([]), false)).toBe('confirm-no-mask');
    expect(privacyApprovalStep(approvable([]), true)).toBe('approve');
  });

  it('TC-245: có ít nhất một vùng che → gửi ngay như luồng cũ', () => {
    expect(privacyApprovalStep(approvable([mask]), false)).toBe('approve');
  });

  it('chưa đủ điều kiện xác nhận (chưa tích) → không gửi, không hỏi', () => {
    const unchecked = privacyEditorReducer(approvable([]), { type: 'check', checked: false });
    expect(privacyApprovalStep(unchecked, true)).toBe('blocked');
  });
});
