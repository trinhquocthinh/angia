import { describe, expect, it } from 'vitest';
import { emailFixture } from '@src/shared/test/accountEmailTestFixture.js';
import { requestEmailVerification } from './requestEmailVerification.js';

describe('Yêu cầu xác minh email', () => {
  it('TC-930: giao kiểm/ghi lượt cho repository trong transaction, đúng tài khoản và đồng hồ', async () => {
    const { deps, emails } = emailFixture();
    expect(await requestEmailVerification(deps, 'account')).toEqual({ ok: true, sent: true });
    expect(emails.requestVerification).toHaveBeenCalledWith('account', deps.now(), deps.rateLimit);
  });
  it('TC-930: phản hồi 204 không tiêu lượt gửi', async () => {
    const { deps, emails } = emailFixture();
    emails.requestVerification.mockResolvedValue({ ok: true, sent: false });
    for (let i = 0; i < 4; i++)
      expect(await requestEmailVerification(deps, 'account')).toEqual({ ok: true, sent: false });
    emails.requestVerification.mockResolvedValue({ ok: true, sent: true });
    expect(await requestEmailVerification(deps, 'account')).toEqual({ ok: true, sent: true });
  });
  it('TC-930: lỗi nghiệp vụ không tiêu lượt gửi', async () => {
    const { deps } = emailFixture();
    deps.emails.requestVerification = async () => ({ ok: false, code: 'ERR_VALIDATION' });
    for (let i = 0; i < 4; i++)
      expect(await requestEmailVerification(deps, 'account')).toEqual({ ok: false, code: 'ERR_VALIDATION' });
    deps.emails.requestVerification = async () => ({ ok: true, sent: true });
    expect(await requestEmailVerification(deps, 'account')).toEqual({ ok: true, sent: true });
  });
  it('TC-925: lỗi queue không tiêu lượt gửi', async () => {
    const { deps } = emailFixture();
    deps.emails.requestVerification = async () => {
      throw new Error('bí mật');
    };
    expect(await requestEmailVerification(deps, 'account')).toEqual({
      ok: false,
      code: 'ERR_AUTH_UNAVAILABLE',
      reason: 'Error',
    });
  });
});
