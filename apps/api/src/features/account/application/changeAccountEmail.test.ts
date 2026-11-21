import { describe, expect, it } from 'vitest';
import { emailFixture } from '@src/shared/test/accountEmailTestFixture.js';
import { changeAccountEmail } from './changeAccountEmail.js';

const input = {
  accountId: 'account',
  sessionId: 'session',
  email: ' LAN@example.com ',
  currentPassword: 'correct',
  ip: 'ip',
};
describe('Đổi email tài khoản', () => {
  it('TC-927: sai mật khẩu không thay đổi email', async () => {
    const { deps, emails } = emailFixture();
    expect(await changeAccountEmail(deps, { ...input, currentPassword: 'wrong' })).toEqual({
      ok: false,
      code: 'ERR_INVALID_CREDENTIALS',
    });
    expect(emails.change).not.toHaveBeenCalled();
  });
  it('TC-932: chuẩn hoá email và kiểm phiên/version khi ghi', async () => {
    const { deps, emails, value } = emailFixture();
    expect(await changeAccountEmail(deps, input)).toEqual({ ok: true, value });
    expect(emails.change).toHaveBeenCalledWith({
      accountId: 'account',
      sessionId: 'session',
      expectedCredentialVersion: 1,
      email: 'lan@example.com',
    });
  });
  it.each(['sai', 'a'.repeat(243) + '@example.com'])(
    'TC-922: email không hợp lệ không được lưu: %s',
    async (email) => {
      const { deps, emails } = emailFixture();
      expect(await changeAccountEmail(deps, { ...input, email })).toEqual({
        ok: false,
        code: 'ERR_VALIDATION',
        details: { field: 'email' },
      });
      expect(emails.change).not.toHaveBeenCalled();
    },
  );
  it('TC-927: không có credential trả cùng lỗi mật khẩu', async () => {
    const { deps } = emailFixture();
    deps.passwords.findCredential = async () => null;
    expect(await changeAccountEmail(deps, input)).toEqual({ ok: false, code: 'ERR_INVALID_CREDENTIALS' });
  });
  it('TC-927: lỗi hash trả 503 không lộ thông điệp', async () => {
    const { deps } = emailFixture();
    deps.hasher.verify = async () => {
      throw new Error('bí mật');
    };
    expect(await changeAccountEmail(deps, input)).toEqual({
      ok: false,
      code: 'ERR_AUTH_UNAVAILABLE',
      reason: 'Error',
    });
  });
  it('TC-927: đổi email dùng cùng hạn mức sai mật khẩu và chặn trước hash', async () => {
    const { deps } = emailFixture();
    let calls = 0;
    deps.rateLimit.store.read = async () => 10;
    deps.hasher.verify = async () => {
      calls++;
      return true;
    };
    expect(await changeAccountEmail(deps, input)).toEqual({
      ok: false,
      code: 'ERR_RATE_LIMITED',
      retryAfterSeconds: 900,
    });
    expect(calls).toBe(0);
  });
  it('TC-927: chỉ ghi lượt sai mật khẩu theo IP và username chuẩn hoá', async () => {
    const { deps } = emailFixture();
    const keys: unknown[] = [];
    deps.rateLimit.keyHasher = (kind, key) => {
      keys.push([kind, key]);
      return 'key';
    };
    await changeAccountEmail(deps, { ...input, currentPassword: 'wrong' });
    expect(keys).toEqual([
      ['login_failed', { ip: 'ip', username: 'lan' }],
      ['login_failed', { ip: 'ip', username: 'lan' }],
    ]);
  });
});
