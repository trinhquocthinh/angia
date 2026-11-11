import { describe, expect, it } from 'vitest';
import type { PrivacyEdits } from '@angia/contracts';
import { initialPrivacyEditor } from './initialPrivacyEditor';
import { privacyEditorReducer } from './privacyEditorState';
const reduce = privacyEditorReducer;
const initial = () => initialPrivacyEditor();
describe('Trình che ảnh trên máy', () => {
  it('trạng thái chỉ còn vùng sửa và lịch sử hoàn tác; mở lại ảnh giữ vùng đã che', () => {
    expect(initial()).toEqual({
      edits: { rotation: 0, crop: { left: 0, top: 0, width: 1000000, height: 1000000 }, masks: [] },
      history: [],
    });
    const edits: PrivacyEdits = { ...initial().edits, rotation: 180 };
    expect(initialPrivacyEditor(edits)).toEqual({ edits, history: [] });
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
  it('TC-891: thêm khung gợi ý chỉ tới trần 32, giữ nguyên vùng cũ, một bước hoàn tác', () => {
    let state = initial();
    for (let n = 0; n < 30; n++)
      state = reduce(state, { type: 'mask', rectangle: { left: n, top: 0, width: 1, height: 1 } });
    const suggested = Array.from({ length: 5 }, (_, n) => ({ left: 100 + n, top: 5, width: 2, height: 2 }));
    const next = reduce(state, { type: 'add-masks', rectangles: suggested });
    expect(next.edits.masks).toEqual([...state.edits.masks, suggested[0], suggested[1]]);
    expect(reduce(next, { type: 'undo' }).edits).toEqual(state.edits);
    expect(reduce(next, { type: 'add-masks', rectangles: suggested })).toBe(next);
  });
  it('TC-210: reset bỏ mọi vùng sửa và lịch sử', () => {
    const masked = reduce(initial(), { type: 'mask', rectangle: { left: 0, top: 0, width: 1, height: 1 } });
    expect(reduce(masked, { type: 'reset' })).toEqual(initial());
  });
});
