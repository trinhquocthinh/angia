import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '@src/shared/api/apiClient';
import { submitEmailVerificationRequest } from './submitEmailVerificationRequest';

const post = vi.spyOn(apiClient, 'POST');
afterEach(() => post.mockReset());

it('TC-925: gửi POST /api/me/email-verifications kèm CSRF nhận 202 { sent: true }', async () => {
  post.mockResolvedValue({
    data: { sent: true },
    response: new Response(null, { status: 202 }),
  } as never);
  const result = await submitEmailVerificationRequest('csrf-2');
  expect(post).toHaveBeenCalledExactlyOnceWith('/api/me/email-verifications', {
    headers: { 'X-CSRF-Token': 'csrf-2' },
  });
  expect(result).toEqual({ ok: true, data: { sent: true } });
});

it('nhận 204 khi email đã xác minh sẵn và không có email chờ đổi', async () => {
  post.mockResolvedValue({ response: new Response(null, { status: 204 }) } as never);
  expect(await submitEmailVerificationRequest('csrf-2')).toEqual({
    ok: true,
    data: { alreadyVerified: true },
  });
});

it.each([
  [409, 'ERR_EMAIL_TAKEN'],
  [429, 'ERR_RATE_LIMITED'],
  [422, 'ERR_VALIDATION'],
])('TC-930/TC-931: trả mã lỗi %s (%s) cùng HTTP status', async (status, code) => {
  post.mockResolvedValue({
    error: { error: { code, message: 'Nội bộ' } },
    response: new Response(null, { status }),
  } as never);
  expect(await submitEmailVerificationRequest('csrf-2')).toEqual({ ok: false, code, status });
});

it('lỗi mạng trả NETWORK và JSON hỏng trả UNKNOWN', async () => {
  post.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  expect(await submitEmailVerificationRequest('csrf-2')).toEqual({ ok: false, code: 'NETWORK' });
  post.mockRejectedValueOnce(new SyntaxError('Unexpected token'));
  expect(await submitEmailVerificationRequest('csrf-2')).toEqual({ ok: false, code: 'UNKNOWN' });
});
