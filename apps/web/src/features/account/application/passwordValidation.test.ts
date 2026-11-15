import { expect, it } from 'vitest';
import { passwordValidation } from './passwordValidation';
it('TC-749: mật khẩu ngắn báo đúng ô', () => {
  expect(passwordValidation({ password: 'short', confirmation: 'short' })).toEqual({
    field: 'password',
    message: 'Mật khẩu cần ít nhất 8 ký tự.',
  });
});
it('TC-749: mật khẩu không khớp báo đúng ô', () => {
  expect(passwordValidation({ password: 'password1', confirmation: 'password2' })).toEqual({
    field: 'confirmation',
    message: 'Hai mật khẩu chưa khớp.',
  });
});
it('TC-900: mật khẩu đủ dài và khớp được chấp nhận', () => {
  expect(passwordValidation({ password: 'password1', confirmation: 'password1' })).toBeNull();
});
