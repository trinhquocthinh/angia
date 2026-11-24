import { expect, it } from 'vitest';
import { normalizeEmail } from './normalizeEmail.js';

it('TC-922: chuẩn hoá email chữ thường và khoảng trắng', () => {
  expect(normalizeEmail(' LAN@Example.COM ')).toBe('lan@example.com');
});
it.each(['', 'lan', 'lan@localhost', 'lan@@example.com', `${'a'.repeat(243)}@example.com`])(
  'TC-922: email sai định dạng hoặc quá dài không hợp lệ: %s',
  (email) => {
    expect(normalizeEmail(email)).toBeNull();
  },
);
it('TC-922: email dài đúng 254 ký tự vẫn hợp lệ', () => {
  const email = `${'a'.repeat(242)}@example.com`;
  expect(normalizeEmail(email)).toBe(email);
});
