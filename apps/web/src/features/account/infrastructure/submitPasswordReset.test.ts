import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '@src/shared/api/apiClient';
import { submitPasswordReset } from './submitPasswordReset';

vi.mock('@src/shared/api/apiClient', () => ({ apiClient: { POST: vi.fn() } }));
const request = vi.mocked(apiClient.POST);
const body = { token: 'reset-token-32-bytes', newPassword: 'MatKhauMoi123!' };

afterEach(() => vi.resetAllMocks());

it('TC-764: POST công khai đúng đường dẫn và body, nhận 204 thành công', async () => {
  request.mockResolvedValue({ response: new Response(null, { status: 204 }) });
  expect(await submitPasswordReset(body)).toEqual({ ok: true, data: undefined });
  expect(request).toHaveBeenCalledExactlyOnceWith('/api/auth/password-resets', { body });
});

it.each([
  [400, 'ERR_RESET_TOKEN_INVALID'],
  [422, 'ERR_VALIDATION'],
  [429, 'ERR_RATE_LIMITED'],
  [503, 'ERR_AUTH_UNAVAILABLE'],
])('HTTP %s giữ mã %s và mã trạng thái, bỏ thông điệp nội bộ', async (status, code) => {
  request.mockResolvedValue({
    response: new Response(null, { status }),
    error: { error: { code, message: 'Nội bộ' } },
  });
  expect(await submitPasswordReset(body)).toEqual({ ok: false, code, status });
});

it.each([
  [new TypeError('fetch failed'), 'NETWORK'],
  [new SyntaxError('invalid JSON'), 'UNKNOWN'],
])('phân biệt lỗi mạng và JSON: %s', async (error, code) => {
  request.mockRejectedValue(error);
  expect(await submitPasswordReset(body)).toEqual({ ok: false, code });
});
