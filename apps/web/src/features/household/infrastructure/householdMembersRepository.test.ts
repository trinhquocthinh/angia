import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '@src/shared/api/apiClient';
import { householdMembersRepository as repository } from './householdMembersRepository';

vi.mock('@src/shared/api/apiClient', () => ({ apiClient: { GET: vi.fn(), PATCH: vi.fn(), POST: vi.fn() } }));
afterEach(() => vi.resetAllMocks());

it('SPEC-066: tải danh sách thành viên trả về mảng members hoặc mã lỗi', async () => {
  const members = [
    { accountId: 'owner-1', displayName: 'Ba Minh', role: 'main' as const, isOwner: true, isSelf: false },
  ];
  vi.mocked(apiClient.GET)
    .mockResolvedValueOnce({ response: new Response(null, { status: 200 }), data: { members } })
    .mockResolvedValueOnce({
      response: new Response(null, { status: 403 }),
      error: { error: { code: 'ERR_FORBIDDEN', message: 'Nội bộ' } },
    });

  expect(await repository.list()).toEqual({ ok: true, value: members });
  expect(apiClient.GET).toHaveBeenCalledWith('/api/family/members');
  expect(await repository.list()).toEqual({ ok: false, code: 'ERR_FORBIDDEN' });
});

it('SPEC-066: đổi vai trò gửi PATCH đúng body và CSRF, chỉ 204 là thành công', async () => {
  vi.mocked(apiClient.PATCH)
    .mockResolvedValueOnce({ response: new Response(null, { status: 204 }) })
    .mockResolvedValueOnce({
      response: new Response(null, { status: 409 }),
      error: { error: { code: 'ERR_LAST_GUARDIAN', message: 'Nội bộ' } },
    });

  expect(await repository.changeRole('acc-2', 'member', 'csrf-1')).toEqual({ ok: true, value: undefined });
  expect(apiClient.PATCH).toHaveBeenCalledWith('/api/family/members/{targetAccountId}', {
    params: { path: { targetAccountId: 'acc-2' } },
    body: { action: 'change_role', role: 'member' },
    headers: { 'X-CSRF-Token': 'csrf-1' },
  });
  expect(await repository.changeRole('acc-2', 'member', 'csrf-1')).toEqual({
    ok: false,
    code: 'ERR_LAST_GUARDIAN',
  });
});

it('SPEC-066: gỡ thành viên gửi PATCH remove kèm CSRF và bắt lỗi mạng', async () => {
  vi.mocked(apiClient.PATCH)
    .mockResolvedValueOnce({ response: new Response(null, { status: 204 }) })
    .mockRejectedValueOnce(new TypeError('network'));

  expect(await repository.remove('acc-3', 'csrf-2')).toEqual({ ok: true, value: undefined });
  expect(apiClient.PATCH).toHaveBeenCalledWith('/api/family/members/{targetAccountId}', {
    params: { path: { targetAccountId: 'acc-3' } },
    body: { action: 'remove' },
    headers: { 'X-CSRF-Token': 'csrf-2' },
  });
  expect(await repository.remove('acc-3', 'csrf-2')).toEqual({ ok: false, code: 'NETWORK' });
});

it('TC-756: đặt lại mật khẩu gửi POST đúng đường dẫn và X-CSRF-Token, ánh xạ 200/429/403/mạng', async () => {
  const payload = { temporaryPassword: 'Temp1234!', expiresAt: '2026-11-24T04:30:00.000Z' };
  vi.mocked(apiClient.POST)
    .mockResolvedValueOnce({ response: new Response(null, { status: 200 }), data: payload })
    .mockResolvedValueOnce({
      response: new Response(null, { status: 429 }),
      error: { error: { code: 'ERR_RATE_LIMITED', message: 'Nội bộ' } },
    })
    .mockResolvedValueOnce({
      response: new Response(null, { status: 403 }),
      error: { error: { code: 'ERR_OWNER_PROTECTED', message: 'Nội bộ' } },
    })
    .mockRejectedValueOnce(new TypeError('network'));

  expect(await repository.resetPassword('acc-hoa', 'csrf-3')).toEqual({ ok: true, value: payload });
  expect(apiClient.POST).toHaveBeenCalledWith('/api/family/members/{targetAccountId}/password-reset', {
    params: { path: { targetAccountId: 'acc-hoa' } },
    headers: { 'X-CSRF-Token': 'csrf-3' },
  });
  expect(await repository.resetPassword('acc-hoa', 'csrf-3')).toEqual({
    ok: false,
    code: 'ERR_RATE_LIMITED',
  });
  expect(await repository.resetPassword('owner-1', 'csrf-3')).toEqual({
    ok: false,
    code: 'ERR_OWNER_PROTECTED',
  });
  expect(await repository.resetPassword('acc-hoa', 'csrf-3')).toEqual({ ok: false, code: 'NETWORK' });
});
