import { describe, expect, it } from 'vitest';
import type { RegistrationInput } from './RegistrationInput.js';
import { validateRegistrationInput } from './validateRegistrationInput.js';

const validPayload: RegistrationInput = {
  username: 'Me.Lan',
  password: 'Password123',
  displayName: 'Mẹ Lan',
  ageConfirmed: true,
  legalAcceptance: {
    termsVersionId: '11111111-1111-4111-8111-111111111111',
    privacyVersionId: '22222222-2222-4222-8222-222222222222',
  },
};

describe('Giới hạn dữ liệu đăng ký', () => {
  it('TC-739: từ chối mật khẩu 1025 ký tự với field password', () => {
    expect(validateRegistrationInput({ ...validPayload, password: 'a'.repeat(1025) })).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { field: 'password' },
    });
  });

  it('TC-739: nhận mật khẩu 1024 ký tự', () => {
    expect(validateRegistrationInput({ ...validPayload, password: 'a'.repeat(1024) }).ok).toBe(true);
  });

  it('TC-739: từ chối email 255 ký tự sau trim với field email', () => {
    const email = `  ${'a'.repeat(250)}@b.co  `;
    expect(validateRegistrationInput({ ...validPayload, email })).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { field: 'email' },
    });
  });

  it('TC-739: nhận email 254 ký tự sau trim', () => {
    const email = `  ${'a'.repeat(249)}@b.co  `;
    expect(validateRegistrationInput({ ...validPayload, email }).ok).toBe(true);
  });

  it('TC-739: từ chối chuỗi email ReDoS trong dưới 50 ms', () => {
    const email = 'a@' + '.'.repeat(100000) + '@';
    const startedAt = performance.now();
    const result = validateRegistrationInput({ ...validPayload, email });
    const elapsedMs = performance.now() - startedAt;
    expect(result).toEqual({ ok: false, code: 'ERR_VALIDATION', details: { field: 'email' } });
    expect(elapsedMs).toBeLessThan(50);
  });

  it('TC-739: từ chối token 513 ký tự trước trim với field invitationToken', () => {
    const invitationToken = ` ${'a'.repeat(512)}`;
    expect(validateRegistrationInput({ ...validPayload, invitationToken })).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { field: 'invitationToken' },
    });
  });

  it('TC-739: nhận token 512 ký tự', () => {
    expect(validateRegistrationInput({ ...validPayload, invitationToken: 'a'.repeat(512) }).ok).toBe(true);
  });
});

describe('Định dạng email đăng ký', () => {
  it.each(['a@b.co', 'a.b@c.d.vn'])('TC-739: nhận email hợp lệ %s', (email) => {
    expect(validateRegistrationInput({ ...validPayload, email }).ok).toBe(true);
  });

  it.each(['a@b', 'a@.b', 'a b@c.d', 'a@b..co'])('TC-739: từ chối email sai %s', (email) => {
    expect(validateRegistrationInput({ ...validPayload, email })).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { field: 'email' },
    });
  });
});
