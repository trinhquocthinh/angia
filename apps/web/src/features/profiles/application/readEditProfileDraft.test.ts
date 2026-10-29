import { describe, expect, it } from 'vitest';
import { readEditProfileDraft } from './readEditProfileDraft';
describe('TC-449 — dữ liệu sửa năm sinh và theo dõi số đo', () => {
  it.each(['', '  ', '1899', '2027', '2020.5', 'abc'])('năm %s không tạo payload lưu', (year) => {
    expect(readEditProfileDraft(year, true, 2026)).toEqual({
      body: null,
      error: 'Nhập năm sinh từ 1900 đến năm nay.',
    });
  });
  it.each([
    ['2020', true],
    ['2020', false],
    ['1900', false],
    ['2026', true],
  ] as const)('năm %s, lựa chọn %s gửi đúng payload', (year, enabled) => {
    expect(readEditProfileDraft(year, enabled, 2026)).toEqual({
      body: { birthYear: Number(year), vitalsEnabled: enabled },
      error: null,
    });
  });
});
