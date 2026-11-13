import { describe, expect, it } from 'vitest';
import type { RegistrationInput } from './RegistrationInput.js';
import { validateRegistrationInput } from './validateRegistrationInput.js';

const validLegal = {
  termsVersionId: '11111111-1111-4111-8111-111111111111',
  privacyVersionId: '22222222-2222-4222-8222-222222222222',
};

const validPayload: RegistrationInput = {
  username: 'Me.Lan',
  password: 'Password123',
  displayName: 'Mẹ Lan',
  email: 'melan@example.com',
  ageConfirmed: true,
  legalAcceptance: validLegal,
};

describe('validateRegistrationInput: thẩm định dữ liệu đăng ký tài khoản local', () => {
  it('TC-736: chuẩn hoá tên đăng nhập chữ thường và trim, giữ họ tên trim', () => {
    const result = validateRegistrationInput({
      ...validPayload,
      username: '  Me.Lan  ',
      displayName: '  Mẹ Lan  ',
    });
    expect(result).toEqual({
      ok: true,
      value: {
        usernameNormalized: 'me.lan',
        password: 'Password123',
        displayName: 'Mẹ Lan',
        email: 'melan@example.com',
        ageConfirmed: true,
        legalAcceptance: validLegal,
        invitationToken: undefined,
      },
    });
  });

  it('TC-737: từ chối mật khẩu trùng tên đăng nhập không phân biệt hoa thường', () => {
    const result = validateRegistrationInput({
      ...validPayload,
      username: 'Me.Lan',
      password: 'me.lan',
    });
    expect(result).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { field: 'password' },
    });

    const resultUppercase = validateRegistrationInput({
      ...validPayload,
      username: 'Me.Lan',
      password: 'ME.LAN',
    });
    expect(resultUppercase).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { field: 'password' },
    });
  });

  it('TC-738: không gửi email vẫn hợp lệ', () => {
    const payload = { ...validPayload };
    delete payload.email;
    const result = validateRegistrationInput(payload);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.email).toBeUndefined();
    }
  });

  it('TC-739: ageConfirmed khác true bị từ chối với details.field = "ageConfirmed"', () => {
    const result = validateRegistrationInput({
      ...validPayload,
      ageConfirmed: false,
    });
    expect(result).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { field: 'ageConfirmed' },
    });
  });

  it('TC-739: tên đăng nhập ngắn hơn 3 hoặc dài hơn 32 ký tự bị từ chối', () => {
    expect(validateRegistrationInput({ ...validPayload, username: 'ab' })).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { field: 'username' },
    });
    expect(validateRegistrationInput({ ...validPayload, username: 'a'.repeat(33) })).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { field: 'username' },
    });
  });

  it('TC-739: tên đăng nhập chứa ký tự cấm (khoảng trắng, ký tự đặc biệt) bị từ chối', () => {
    expect(validateRegistrationInput({ ...validPayload, username: 'me lan' })).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { field: 'username' },
    });
    expect(validateRegistrationInput({ ...validPayload, username: 'me@lan' })).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { field: 'username' },
    });
  });

  it('TC-739: mật khẩu ngắn hơn 8 ký tự bị từ chối với details.field = "password"', () => {
    expect(validateRegistrationInput({ ...validPayload, password: 'short' })).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { field: 'password' },
    });
  });

  it('TC-739: tên hiển thị rỗng hoặc vượt 60 ký tự bị từ chối', () => {
    expect(validateRegistrationInput({ ...validPayload, displayName: '   ' })).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { field: 'displayName' },
    });
    expect(validateRegistrationInput({ ...validPayload, displayName: 'x'.repeat(61) })).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { field: 'displayName' },
    });
  });

  it('TC-739: email sai định dạng bị từ chối với details.field = "email"', () => {
    expect(validateRegistrationInput({ ...validPayload, email: 'sai-email' })).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { field: 'email' },
    });
  });

  it('TC-739: legalAcceptance không hợp lệ bị từ chối với details.field = "legalAcceptance"', () => {
    expect(
      validateRegistrationInput({
        ...validPayload,
        legalAcceptance: { termsVersionId: 'not-uuid', privacyVersionId: validLegal.privacyVersionId },
      }),
    ).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { field: 'legalAcceptance' },
    });
  });
});
