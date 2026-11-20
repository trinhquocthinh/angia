import { describe, expect, it } from 'vitest';
import { needsProfileGuardian } from './needsProfileGuardian.js';
describe('Phân loại hồ sơ cần người giám hộ', () => {
  it('TC-809/814: dùng tuổi dưới 18 theo năm Việt Nam và tình trạng liên kết', () => {
    const at = new Date('2026-12-31T17:00:00Z');
    expect(needsProfileGuardian(2010, false, at)).toBe(true);
    expect(needsProfileGuardian(2009, false, at)).toBe(false);
    expect(needsProfileGuardian(null, false, at)).toBe(false);
    expect(needsProfileGuardian(2020, true, at)).toBe(false);
  });
});
