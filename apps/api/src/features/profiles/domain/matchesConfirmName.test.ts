import { describe, expect, it } from 'vitest';
import { matchesConfirmName } from './matchesConfirmName.js';

describe('So tên xác nhận xóa hồ sơ (SPEC-007)', () => {
  it('TC-365: khớp khi cùng tên, kể cả dạng Unicode dựng sẵn và tổ hợp', () => {
    expect(matchesConfirmName('Mẹ', 'Mẹ')).toBe(true);
    expect(matchesConfirmName('Mẹ', 'Mẹ')).toBe(true);
    expect(matchesConfirmName('Mẹ', 'Mẹ')).toBe(true);
  });
  it.each(['me', 'Mẹ ', ' Mẹ', 'MẸ', ''])('TC-365: không khớp với %j', (confirmName) => {
    expect(matchesConfirmName('Mẹ', confirmName)).toBe(false);
  });
});
