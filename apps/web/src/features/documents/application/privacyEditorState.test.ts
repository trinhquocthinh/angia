import { describe, expect, it } from 'vitest';
import type { PrivacyDraft } from '@angia/contracts';
import { initialPrivacyEditor } from './initialPrivacyEditor';
import { canApprovePrivacy } from './canApprovePrivacy';
import { privacyEditorReducer } from './privacyEditorState';
const ready: PrivacyDraft = {
  state: 'ready',
  draftId: 'draft-a',
  sha256: 'a'.repeat(64),
  imageUrl: '/image-a',
};
const reduce = privacyEditorReducer;
const initial = () => initialPrivacyEditor();
const viewed = () => {
  let state = reduce(initial(), { type: 'remote', revision: 0, draft: ready });
  state = reduce(state, { type: 'loaded', draftId: 'draft-a', sha256: 'a'.repeat(64) });
  return reduce(state, { type: 'check', checked: true });
};
describe('Duyệt đúng bản ảnh riêng tư', () => {
  it('TC-204: checkbox mặc định bỏ chọn và ảnh chưa tải không được duyệt', () => {
    const state = reduce(initial(), { type: 'remote', revision: 0, draft: ready });
    expect(canApprovePrivacy(state)).toBe(false);
    expect(reduce(state, { type: 'check', checked: true }).checked).toBe(false);
    expect(canApprovePrivacy(viewed())).toBe(true);
  });
  it('TC-205: sửa vùng che làm mất ảnh đã tải và xác nhận', () => {
    const state = reduce(viewed(), {
      type: 'mask',
      rectangle: { left: 0, top: 0, width: 200000, height: 100000 },
    });
    expect(state.checked).toBe(false);
    expect(state.loaded).toBeNull();
    expect(canApprovePrivacy(state)).toBe(false);
  });
  it('TC-206: phản hồi của yêu cầu cũ không cho duyệt vùng sửa mới', () => {
    const edited = reduce(initial(), {
      type: 'crop',
      rectangle: { left: 0, top: 0, width: 500000, height: 500000 },
    });
    const old = reduce(edited, { type: 'remote', revision: 0, draft: ready });
    const loaded = reduce(old, { type: 'loaded', draftId: 'draft-a', sha256: 'a'.repeat(64) });
    expect(canApprovePrivacy(reduce(loaded, { type: 'check', checked: true }))).toBe(false);
  });
  it('TC-207: lỗi tải ảnh hoặc đổi hash làm mất xác nhận', () => {
    expect(canApprovePrivacy(reduce(viewed(), { type: 'image-failed' }))).toBe(false);
    const next = reduce(viewed(), {
      type: 'remote',
      revision: 0,
      draft: { ...ready, sha256: 'b'.repeat(64) },
    });
    expect(canApprovePrivacy(next)).toBe(false);
  });
  it('TC-208: xoay đặt lại vùng cắt, che và hoàn tác khôi phục sửa đổi trước', () => {
    const cropped = reduce(initial(), {
      type: 'crop',
      rectangle: { left: 0, top: 0, width: 500000, height: 500000 },
    });
    const rotated = reduce(cropped, { type: 'rotate' });
    expect(rotated.edits).toEqual({
      rotation: 90,
      crop: { left: 0, top: 0, width: 1000000, height: 1000000 },
      masks: [],
    });
    expect(reduce(rotated, { type: 'undo' }).edits).toEqual(cropped.edits);
  });
  it('TC-209: không cho thêm quá 32 vùng che, có thể bỏ một vùng', () => {
    let state = initial();
    for (let n = 0; n < 33; n++)
      state = reduce(state, { type: 'mask', rectangle: { left: 0, top: 0, width: 1, height: 1 } });
    expect(state.edits.masks).toHaveLength(32);
    expect(reduce(state, { type: 'remove-mask', index: 4 }).edits.masks).toHaveLength(31);
  });
  it('TC-210: reset chứng từ hoặc phiên không giữ bản xem và checkbox', () => {
    expect(reduce(viewed(), { type: 'reset' })).toEqual(initial());
  });
});
