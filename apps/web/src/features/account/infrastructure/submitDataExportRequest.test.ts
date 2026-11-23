import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '@src/shared/api/apiClient';
import { submitDataExportRequest } from '@src/features/account/infrastructure/submitDataExportRequest';

const post = vi.spyOn(apiClient, 'POST');
afterEach(() => post.mockReset());

it('TC-819/TC-820: gửi POST /api/me/data-exports kèm CSRF và phạm vi nhận 202 { exportId }', async () => {
  post.mockResolvedValue({
    data: { exportId: 'exp-123' },
    response: new Response(null, { status: 202 }),
  } as never);

  const selfResult = await submitDataExportRequest('self', 'csrf-1');
  expect(post).toHaveBeenCalledWith('/api/me/data-exports', {
    headers: { 'X-CSRF-Token': 'csrf-1' },
    body: { scope: 'self' },
  });
  expect(selfResult).toEqual({ ok: true, data: { exportId: 'exp-123' } });

  const profileResult = await submitDataExportRequest({ profileId: 'prof-1' }, 'csrf-1');
  expect(post).toHaveBeenLastCalledWith('/api/me/data-exports', {
    headers: { 'X-CSRF-Token': 'csrf-1' },
    body: { scope: { profileId: 'prof-1' } },
  });
  expect(profileResult).toEqual({ ok: true, data: { exportId: 'exp-123' } });
});

it.each([
  [404, 'ERR_NOT_FOUND'],
  [429, 'ERR_RATE_LIMITED'],
])('TC-821: trả mã lỗi %s (%s) cùng HTTP status', async (status, code) => {
  post.mockResolvedValue({
    error: { error: { code, message: 'Nội bộ' } },
    response: new Response(null, { status }),
  } as never);
  expect(await submitDataExportRequest('self', 'csrf-1')).toEqual({ ok: false, code, status });
});

it('lỗi mạng trả NETWORK và lỗi JSON trả UNKNOWN', async () => {
  post.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  expect(await submitDataExportRequest('self', 'csrf-1')).toEqual({ ok: false, code: 'NETWORK' });
  post.mockRejectedValueOnce(new SyntaxError('Unexpected token'));
  expect(await submitDataExportRequest('self', 'csrf-1')).toEqual({ ok: false, code: 'UNKNOWN' });
});
