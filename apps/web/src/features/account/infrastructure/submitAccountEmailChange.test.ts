import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '@src/shared/api/apiClient';
import { submitAccountEmailChange } from './submitAccountEmailChange';

const patch = vi.spyOn(apiClient, 'PATCH');
afterEach(() => patch.mockReset());

it('TC-932: gửi PATCH /api/me/email kèm CSRF và trả trạng thái email mới khi 200', async () => {
  const data = { email: 'lan@example.com', emailVerified: false, pendingEmail: null };
  patch.mockResolvedValue({ data, response: new Response(null, { status: 200 }) } as never);
  const result = await submitAccountEmailChange(
    { email: 'lan@example.com', currentPassword: 'matkhau123' },
    'csrf-1',
  );
  expect(patch).toHaveBeenCalledExactlyOnceWith('/api/me/email', {
    body: { email: 'lan@example.com', currentPassword: 'matkhau123' },
    headers: { 'X-CSRF-Token': 'csrf-1' },
  });
  expect(result).toEqual({ ok: true, data });
});

it.each([
  [401, 'ERR_INVALID_CREDENTIALS'],
  [422, 'ERR_VALIDATION'],
  [429, 'ERR_RATE_LIMITED'],
])('TC-927: trả mã lỗi %s và status khi PATCH thất bại (%s)', async (status, code) => {
  patch.mockResolvedValue({
    error: { error: { code, message: 'Nội bộ' } },
    response: new Response(null, { status }),
  } as never);
  const result = await submitAccountEmailChange(
    { email: 'lan@example.com', currentPassword: 'sai' },
    'csrf-1',
  );
  expect(result).toEqual({ ok: false, code, status });
});

it('lỗi mạng trả NETWORK và JSON hỏng trả UNKNOWN', async () => {
  patch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  expect(
    await submitAccountEmailChange({ email: 'lan@example.com', currentPassword: 'pw' }, 'csrf-1'),
  ).toEqual({ ok: false, code: 'NETWORK' });
  patch.mockRejectedValueOnce(new SyntaxError('Unexpected token'));
  expect(
    await submitAccountEmailChange({ email: 'lan@example.com', currentPassword: 'pw' }, 'csrf-1'),
  ).toEqual({ ok: false, code: 'UNKNOWN' });
});
