import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '@src/shared/api/apiClient';
import { submitRegistration } from './submitRegistration';
vi.mock('@src/shared/api/apiClient', () => ({ apiClient: { POST: vi.fn() } }));
const request = vi.mocked(apiClient.POST);
const body = {
  username: 'me.lan',
  password: 'matkhau123',
  displayName: 'Lan',
  ageConfirmed: false,
  legalAcceptance: { termsVersionId: 'terms', privacyVersionId: 'privacy' },
};
const data = {
  account: { id: 'account', username: 'me.lan', displayName: 'Lan', familyId: null },
  session: { csrfToken: 'csrf', expiresAt: '2026-12-01T00:00:00Z' },
};
afterEach(() => vi.resetAllMocks());
it('trả dữ liệu thành công và gửi đúng DTO', async () => {
  request.mockResolvedValue({ response: new Response(null, { status: 201 }), data });
  expect(await submitRegistration(body)).toEqual({ ok: true, data });
  expect(request).toHaveBeenCalledWith('/api/auth/register', { body });
});
it.each([
  [401, 'ERR_INVALID_CREDENTIALS'],
  [403, 'ERR_ACCOUNT_LOCKED'],
  [403, 'ERR_FORBIDDEN'],
  [409, 'ERR_USERNAME_TAKEN'],
  [403, 'ERR_REGISTRATION_CLOSED'],
  [422, 'ERR_VALIDATION'],
  [429, 'ERR_RATE_LIMITED'],
  [503, 'ERR_AUTH_UNAVAILABLE'],
])('HTTP %s giữ mã %s, bỏ message API', async (status, code) => {
  request.mockResolvedValue({
    response: new Response(null, { status }),
    error: { error: { code, message: 'Không hiển thị' } },
  });
  expect(await submitRegistration(body)).toEqual({ ok: false, code });
});
it('giữ trường lỗi và bản legal hiện hành nếu có', async () => {
  request.mockResolvedValue({
    response: new Response(null, { status: 409 }),
    error: {
      error: {
        code: 'ERR_LEGAL_VERSION_OUTDATED',
        message: 'nội bộ',
        details: { field: 'username', current: { invalid: true } },
      },
    },
  });
  expect(await submitRegistration(body)).toEqual({
    ok: false,
    code: 'ERR_LEGAL_VERSION_OUTDATED',
    field: 'username',
    current: { invalid: true },
  });
});
it('mất mạng trả mã NETWORK', async () => {
  request.mockRejectedValue(new TypeError('fetch failed'));
  expect(await submitRegistration(body)).toEqual({ ok: false, code: 'NETWORK' });
});
it('body không đọc được dùng lỗi chung, không gọi là mất mạng', async () => {
  request.mockRejectedValue(new SyntaxError('Unexpected token'));
  expect(await submitRegistration(body)).toEqual({ ok: false, code: 'UNKNOWN' });
});
it('body thiếu dữ liệu trả mã UNKNOWN', async () => {
  request.mockResolvedValue({ response: new Response(null, { status: 500 }) });
  expect(await submitRegistration(body)).toEqual({ ok: false, code: 'UNKNOWN' });
});
