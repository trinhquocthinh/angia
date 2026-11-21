import { describe, expect, it } from 'vitest';
import { emailFixture } from '@src/shared/test/accountEmailTestFixture.js';
import { confirmEmailVerification } from './confirmEmailVerification.js';

describe('Xác nhận email', () => {
  it('TC-925: xác nhận token trong thao tác nguyên tử', async () => {
    const { deps, emails } = emailFixture();
    expect(await confirmEmailVerification(deps, 'token')).toEqual({ ok: true });
    expect(emails.confirmVerification).toHaveBeenCalledWith('token', new Date(0));
  });
  it('TC-926: trả lỗi token từ kho lưu trữ', async () => {
    const { deps } = emailFixture();
    deps.emails.confirmVerification = async () => ({ ok: false, code: 'ERR_VERIFICATION_TOKEN_INVALID' });
    expect(await confirmEmailVerification(deps, 'token')).toEqual({
      ok: false,
      code: 'ERR_VERIFICATION_TOKEN_INVALID',
    });
  });
  it('TC-931: giữ lỗi tranh chấp email', async () => {
    const { deps } = emailFixture();
    deps.emails.confirmVerification = async () => ({ ok: false, code: 'ERR_EMAIL_TAKEN' });
    expect(await confirmEmailVerification(deps, 'token')).toEqual({ ok: false, code: 'ERR_EMAIL_TAKEN' });
  });
  it('TC-926: lỗi kho không lộ token hoặc thông điệp', async () => {
    const { deps } = emailFixture();
    deps.emails.confirmVerification = async () => {
      throw new Error('token bí mật');
    };
    expect(await confirmEmailVerification(deps, 'token')).toEqual({
      ok: false,
      code: 'ERR_AUTH_UNAVAILABLE',
      reason: 'Error',
    });
  });
});
