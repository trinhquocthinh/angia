import { describe, expect, it } from 'vitest';
import { validateNewPassword } from './validateNewPassword.js';

describe('Quy tắc mật khẩu dùng chung', () => {
  it.each([
    [1024, true],
    [1025, false],
  ])('TC-739: mật khẩu dài %i ký tự có kết quả hợp lệ là %s', (length, valid) => {
    expect(validateNewPassword('a'.repeat(length), 'username')).toBe(valid);
  });

  it.each([
    ['1234567', 'username', false],
    ['12345678', 'username', true],
    ['USERNAME', 'username', false],
    [' username ', 'username', true],
  ] as const)('kiểm tra mật khẩu %s với username %s', (password, username, valid) => {
    expect(validateNewPassword(password, username)).toBe(valid);
  });
});
