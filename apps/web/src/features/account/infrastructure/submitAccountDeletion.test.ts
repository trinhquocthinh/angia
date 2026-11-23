import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '@src/shared/api/apiClient';
import { submitAccountDeletion } from '@src/features/account/infrastructure/submitAccountDeletion';

const post = vi.spyOn(apiClient, 'POST');
afterEach(() => post.mockReset());

it('TC-827/TC-831: gửi POST /api/me/account-deletion kèm CSRF nhận 204', async () => {
  post.mockResolvedValue({ response: new Response(null, { status: 204 }) } as never);

  const withoutProfile = await submitAccountDeletion({ password: 'matkhau123' }, 'csrf-del');
  expect(post).toHaveBeenCalledWith('/api/me/account-deletion', {
    headers: { 'X-CSRF-Token': 'csrf-del' },
    body: { password: 'matkhau123' },
  });
  expect(withoutProfile).toEqual({ ok: true, data: undefined });

  const withProfile = await submitAccountDeletion(
    { password: 'matkhau123', ownProfileDisposition: 'keep' },
    'csrf-del',
  );
  expect(post).toHaveBeenLastCalledWith('/api/me/account-deletion', {
    headers: { 'X-CSRF-Token': 'csrf-del' },
    body: { password: 'matkhau123', ownProfileDisposition: 'keep' },
  });
  expect(withProfile).toEqual({ ok: true, data: undefined });
});

it.each([
  [401, 'ERR_INVALID_CREDENTIALS'],
  [409, 'ERR_OWNER_MUST_TRANSFER'],
  [409, 'ERR_OWNER_MUST_DELETE_FAMILY'],
  [409, 'ERR_LAST_GUARDIAN'],
  [429, 'ERR_RATE_LIMITED'],
])('TC-829/TC-830: trả mã lỗi %s (%s) cùng HTTP status', async (status, code) => {
  post.mockResolvedValue({
    error: { error: { code, message: 'Nội bộ' } },
    response: new Response(null, { status }),
  } as never);
  expect(await submitAccountDeletion({ password: 'sai' }, 'csrf-del')).toEqual({
    ok: false,
    code,
    status,
  });
});

it('lỗi mạng trả NETWORK và lỗi JSON trả UNKNOWN', async () => {
  post.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  expect(await submitAccountDeletion({ password: 'p' }, 'csrf-del')).toEqual({
    ok: false,
    code: 'NETWORK',
  });
  post.mockRejectedValueOnce(new SyntaxError('Unexpected token'));
  expect(await submitAccountDeletion({ password: 'p' }, 'csrf-del')).toEqual({
    ok: false,
    code: 'UNKNOWN',
  });
});
