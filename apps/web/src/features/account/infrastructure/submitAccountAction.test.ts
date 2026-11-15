import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '@src/shared/api/apiClient';
import { submitAccountAction } from './submitAccountAction';
vi.mock('@src/shared/api/apiClient', () => ({ apiClient: { POST: vi.fn() } }));
const request = vi.mocked(apiClient.POST);
afterEach(() => vi.resetAllMocks());
it.each(['/api/me/password', '/api/me/local-credential', '/api/me/legal-acceptances'] as const)(
  'TC-749/753/900: %s chấp nhận 204 và gửi CSRF',
  async (path) => {
    request.mockResolvedValue({ response: new Response(null, { status: 204 }) });
    const body =
      path === '/api/me/password'
        ? { newPassword: 'password1' }
        : path === '/api/me/legal-acceptances'
          ? { versionIds: ['terms', 'privacy'] }
          : { password: 'password1' };
    expect(await submitAccountAction(path, body, 'csrf')).toEqual({ ok: true, data: undefined });
    expect(request).toHaveBeenCalledWith(path, { body, headers: { 'X-CSRF-Token': 'csrf' } });
  },
);
it.each([
  [401, 'ERR_UNAUTHENTICATED'],
  [403, 'ERR_FORBIDDEN'],
  [404, 'NOT_FOUND'],
  [409, 'ERR_CREDENTIAL_ALREADY_SET'],
])('TC-901/902: HTTP %s giữ mã và trạng thái', async (status, code) => {
  request.mockResolvedValue({
    response: new Response(null, { status: Number(status) }),
    error: { error: { code: String(code), message: '' } },
  });
  expect(
    await submitAccountAction('/api/me/local-credential', { password: 'password1' }, 'csrf'),
  ).toMatchObject({ ok: false, code, status });
});
it('TC-753: mất mạng có chuỗi lỗi phù hợp', async () => {
  request.mockRejectedValue(new TypeError('fetch'));
  expect(await submitAccountAction('/api/me/password', { newPassword: 'password1' }, 'csrf')).toEqual({
    ok: false,
    code: 'NETWORK',
  });
});
