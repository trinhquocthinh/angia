import { describe, expect, it } from 'vitest';
import { readProfileDraft } from './readProfileDraft';
describe('TC-008 — Kiểm tra dữ liệu tạo hồ sơ', () => {
  it('TC-449 — năm sinh bắt buộc, tài khoản có thể bỏ trống', () => {
    expect(readProfileDraft(' Mẹ ', '', '', 2026).body).toBeNull();
    expect(readProfileDraft(' Mẹ ', '1954', '', 2026)).toEqual({
      body: { displayName: 'Mẹ', birthYear: 1954 },
      errors: {},
    });
  });
  it.each(['', '   ', '1899', '2027', '2000.5', 'abc'])('từ chối năm sinh %s', (year) => {
    expect(readProfileDraft('Mẹ', year, '', 2026).errors.birthYear).toBeTruthy();
  });
  it('chấp nhận năm 1900 và năm hiện tại, từ chối tên rỗng hoặc dài', () => {
    expect(readProfileDraft('Ba', '1900', '', 2026).body?.birthYear).toBe(1900);
    expect(readProfileDraft('Ba', '2026', 'account', 2026).body?.linkedAccountId).toBe('account');
    expect(readProfileDraft(' ', '', '', 2026).errors.displayName).toBeTruthy();
    expect(readProfileDraft('a'.repeat(61), '', '', 2026).errors.displayName).toBeTruthy();
  });
});
