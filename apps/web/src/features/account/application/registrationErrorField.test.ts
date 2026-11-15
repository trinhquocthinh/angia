import { expect, it } from 'vitest';
import { registrationErrorField } from './registrationErrorField';
it('TC-737: tên trùng luôn liên kết với username', () => {
  expect(registrationErrorField({ ok: false, code: 'ERR_USERNAME_TAKEN' })).toBe('username');
});
it.each(['username', 'password', 'displayName', 'email', 'ageConfirmed'])(
  'lỗi định dạng của %s chỉ liên kết đúng ô',
  (field) => {
    expect(registrationErrorField({ ok: false, code: 'ERR_VALIDATION', field })).toBe(field);
  },
);
it('trường không khớp và lỗi khác vẫn là lỗi chung', () => {
  expect(registrationErrorField({ ok: false, code: 'ERR_VALIDATION', field: 'unknown' })).toBeNull();
  expect(registrationErrorField({ ok: false, code: 'ERR_RATE_LIMITED', field: 'username' })).toBeNull();
});
