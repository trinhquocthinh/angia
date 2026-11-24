import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '@src/shared/api/apiClient';
import { submitPasswordResetRequest } from './submitPasswordResetRequest';
vi.mock('@src/shared/api/apiClient', () => ({ apiClient: { POST: vi.fn() } }));
const request = vi.mocked(apiClient.POST);
const body = { email: 'lan@example.com' };
afterEach(() => vi.resetAllMocks());
it('TC-762: POST công khai đúng đường dẫn và body, nhận 202 đồng nhất', async () => {
  request.mockResolvedValue({ response: new Response(null, { status: 202 }), data: { received: true } });
  expect(await submitPasswordResetRequest(body)).toEqual({ ok: true, data: { received: true } });
  expect(request).toHaveBeenCalledExactlyOnceWith('/api/auth/password-reset-requests', { body });
});
it.each([
  [429, 'ERR_RATE_LIMITED'],
  [422, 'ERR_VALIDATION'],
])('HTTP %s giữ mã %s, bỏ thông tin nội bộ', async (status, code) => {
  request.mockResolvedValue({
    response: new Response(null, { status }),
    error: { error: { code, message: 'Nội bộ' } },
  });
  expect(await submitPasswordResetRequest(body)).toEqual({ ok: false, code });
});
it.each([
  [new TypeError('fetch failed'), 'NETWORK'],
  [new SyntaxError('invalid JSON'), 'UNKNOWN'],
])('phân biệt lỗi mạng và JSON: %s', async (error, code) => {
  request.mockRejectedValue(error);
  expect(await submitPasswordResetRequest(body)).toEqual({ ok: false, code });
});
