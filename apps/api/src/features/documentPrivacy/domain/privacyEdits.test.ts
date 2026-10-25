import { describe, expect, it } from 'vitest';
import { validPrivacyEdits } from './privacyEdits.js';
const crop = { left: 0, top: 0, width: 1_000_000, height: 1_000_000 };
describe('Hình học bảo vệ định danh', () => {
  it('TC-163: chấp nhận toàn ảnh và không bắt buộc vùng che', () =>
    expect(validPrivacyEdits({ rotation: 0, crop, masks: [] })).toBe(true));
  it('TC-164: từ chối vùng tràn, số lẻ, chiều rỗng, quá 32 vùng và góc xoay sai', () => {
    for (const rect of [
      { ...crop, left: 1 },
      { ...crop, width: 0 },
      { ...crop, top: 0.5 },
      { ...crop, top: -1 },
    ])
      expect(validPrivacyEdits({ rotation: 0, crop: rect, masks: [] })).toBe(false);
    expect(validPrivacyEdits({ rotation: 0, crop, masks: Array(33).fill(crop) })).toBe(false);
    expect(validPrivacyEdits({ rotation: 45 as 0, crop, masks: [] })).toBe(false);
  });
});
