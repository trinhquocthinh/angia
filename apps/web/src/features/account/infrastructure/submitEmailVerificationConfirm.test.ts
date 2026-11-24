import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '@src/shared/api/apiClient';
import { submitEmailVerificationConfirm } from './submitEmailVerificationConfirm';

vi.mock('@src/shared/api/apiClient', () => ({ apiClient: { POST: vi.fn() } }));
const request = vi.mocked(apiClient.POST);
const body = { token: 'verify-token-32-bytes' };

afterEach(() => vi.resetAllMocks());

it('TC-925: POST công khai đúng đường dẫn và body, nhận 204 thành công', async () => {
  request.mockResolvedValue({ response: new Response(null, { status: 204 }) });
  expect(await submitEmailVerificationConfirm(body)).toEqual({ ok: true, data: undefined });
  expect(request).toHaveBeenCalledExactlyOnceWith('/api/auth/email-verifications/confirm', { body });
});

it.each([
  ['TC-926', 400, 'ERR_VERIFICATION_TOKEN_INVALID'],
  ['TC-931', 409, 'ERR_EMAIL_TAKEN'],
  ['TC-925', 429, 'ERR_RATE_LIMITED'],
  ['TC-925', 503, 'ERR_AUTH_UNAVAILABLE'],
])('%s: HTTP %s giữ mã %s và mã trạng thái, bỏ thông điệp nội bộ', async (_tc, status, code) => {
  request.mockResolvedValue({
    response: new Response(null, { status }),
    error: { error: { code, message: 'Nội bộ' } },
  });
  expect(await submitEmailVerificationConfirm(body)).toEqual({ ok: false, code, status });
});

it.each([
  [new TypeError('fetch failed'), 'NETWORK'],
  [new SyntaxError('invalid JSON'), 'UNKNOWN'],
])('phân biệt lỗi mạng và JSON: %s', async (error, code) => {
  request.mockRejectedValue(error);
  expect(await submitEmailVerificationConfirm(body)).toEqual({ ok: false, code });
});
