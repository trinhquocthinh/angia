import { describe, expect, it } from 'vitest';
import { PasswordHashBusyError } from '@src/shared/identity/application/PasswordHashBusyError.js';
import { passwordResetFixture } from '@src/shared/test/passwordResetTestFixture.js';
import { requestPasswordReset } from './requestPasswordReset.js';
import { resetPasswordByEmail } from './resetPasswordByEmail.js';

describe('SPEC-063: đặt lại mật khẩu qua email', () => {
  it('TC-762: trả đồng nhất và không chờ tra email ở việc nền', async () => {
    const { deps, tasks, resets } = passwordResetFixture();
    resets.request.mockImplementation(() => new Promise(() => {}));
    for (const email of [' LAN@EXAMPLE.COM ', 'unknown@example.com', 'unverified@example.com']) {
      expect(await requestPasswordReset(deps, { email, ip: 'ip' })).toEqual({ ok: true });
    }
    expect(resets.request).not.toHaveBeenCalled();
    expect(tasks).toHaveLength(3);
  });
  it('TC-766: đếm riêng mọi IP và email chuẩn hoá, kể cả không tồn tại', async () => {
    const { deps, counts } = passwordResetFixture();
    for (let i = 0; i < 3; i++) {
      expect(await requestPasswordReset(deps, { email: ' UNKNOWN@example.com ', ip: `ip${i}` })).toEqual({
        ok: true,
      });
    }
    expect(await requestPasswordReset(deps, { email: 'unknown@example.com', ip: 'new-ip' })).toMatchObject({
      code: 'ERR_RATE_LIMITED',
    });
    expect(counts.get('password_reset_request_email:unknown@example.com')).toBe(4);
    for (let i = 0; i < 3; i++)
      await requestPasswordReset(deps, { email: `other${i}@example.com`, ip: 'same' });
    expect(await requestPasswordReset(deps, { email: 'different@example.com', ip: 'same' })).toMatchObject({
      code: 'ERR_RATE_LIMITED',
    });
  });
  it('TC-766: lỗi store chặn và không khởi động việc nền', async () => {
    const { deps, tasks } = passwordResetFixture();
    deps.rateLimit.store.increment = async () => {
      throw new Error('store');
    };
    expect(await requestPasswordReset(deps, { email: 'a@example.com', ip: 'ip' })).toMatchObject({
      code: 'ERR_AUTH_UNAVAILABLE',
    });
    expect(tasks).toEqual([]);
  });
  it('TC-765: token sai không được hash hoặc tiêu token', async () => {
    const { deps, resets } = passwordResetFixture();
    resets.findValid.mockResolvedValueOnce(null);
    expect(await resetPasswordByEmail(deps, { token: 'bad', newPassword: 'Strong123' })).toEqual({
      ok: false,
      code: 'ERR_RESET_TOKEN_INVALID',
    });
    expect(deps.hasher.hash).not.toHaveBeenCalled();
    expect(resets.consume).not.toHaveBeenCalled();
  });
  it.each(['short', 'lan'])('TC-764: mật khẩu yếu %s không tiêu token', async (newPassword) => {
    const { deps, resets } = passwordResetFixture();
    expect(await resetPasswordByEmail(deps, { token: 'valid', newPassword })).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { field: 'newPassword' },
    });
    expect(resets.consume).not.toHaveBeenCalled();
  });
  it('TC-764: hash trước khi tiêu token, kiểm lại token sau hash', async () => {
    const { deps, resets } = passwordResetFixture();
    expect(await resetPasswordByEmail(deps, { token: 'valid', newPassword: 'Strong123' })).toEqual({
      ok: true,
    });
    expect(resets.consume).toHaveBeenCalledWith('valid', 'account', 'new-hash', new Date(0));
    resets.consume.mockResolvedValueOnce(false);
    expect(await resetPasswordByEmail(deps, { token: 'valid', newPassword: 'Strong123' })).toEqual({
      ok: false,
      code: 'ERR_RESET_TOKEN_INVALID',
    });
  });
  it('TC-764: hết tài nguyên hash trả lỗi tạm gián đoạn và không tiêu token', async () => {
    const { deps, resets } = passwordResetFixture();
    deps.hasher.hash = async () => {
      throw new PasswordHashBusyError();
    };
    expect(await resetPasswordByEmail(deps, { token: 'valid', newPassword: 'Strong123' })).toMatchObject({
      code: 'ERR_AUTH_UNAVAILABLE',
      reason: 'PasswordHashBusyError',
    });
    expect(resets.consume).not.toHaveBeenCalled();
  });
});
