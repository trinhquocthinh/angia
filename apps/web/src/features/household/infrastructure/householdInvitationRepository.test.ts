import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '@src/shared/api/apiClient';
import { householdInvitationRepository as repository } from './householdInvitationRepository';

vi.mock('@src/shared/api/apiClient', () => ({ apiClient: { POST: vi.fn(), DELETE: vi.fn() } }));
afterEach(() => vi.resetAllMocks());
it('TC-773: phát hành gửi DTO và CSRF, giữ nguyên mã/link API', async () => {
  const value = {
    invitationId: 'id',
    code: 'A7F29C4E8B1D',
    link: 'https://angia.example/invite#token=Secret',
    expiresAt: '2026-11-25T00:00:00Z',
  };
  vi.mocked(apiClient.POST).mockResolvedValue({ response: new Response(null, { status: 201 }), data: value });
  expect(await repository.create({ kind: 'join_family', role: 'main' }, 'csrf')).toEqual({ ok: true, value });
  expect(apiClient.POST).toHaveBeenCalledWith('/api/family/invitations', {
    body: { kind: 'join_family', role: 'main' },
    headers: { 'X-CSRF-Token': 'csrf' },
  });
});
it('TC-777: thu hồi gửi đúng ID/CSRF, chỉ 204 mới là thành công', async () => {
  vi.mocked(apiClient.DELETE)
    .mockResolvedValueOnce({ response: new Response(null, { status: 204 }) })
    .mockResolvedValueOnce({
      response: new Response(null, { status: 404 }),
      error: { error: { code: 'ERR_NOT_FOUND', message: 'Nội bộ' } },
    });
  expect(await repository.revoke('id', 'csrf')).toEqual({ ok: true, value: undefined });
  expect(apiClient.DELETE).toHaveBeenCalledWith('/api/family/invitations/{id}', {
    params: { path: { id: 'id' } },
    headers: { 'X-CSRF-Token': 'csrf' },
  });
  expect(await repository.revoke('id', 'csrf')).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
});
it('TC-773: lỗi mạng hoặc JSON sai không rò message nội bộ', async () => {
  vi.mocked(apiClient.POST)
    .mockRejectedValueOnce(new TypeError('private'))
    .mockRejectedValueOnce(new SyntaxError('private'));
  expect(await repository.create({ kind: 'join_family', role: 'member' }, 'csrf')).toEqual({
    ok: false,
    code: 'NETWORK',
  });
  expect(await repository.create({ kind: 'join_family', role: 'member' }, 'csrf')).toEqual({
    ok: false,
    code: 'UNKNOWN',
  });
  vi.mocked(apiClient.DELETE).mockRejectedValue(new Error('private'));
  expect(await repository.revoke('id', 'csrf')).toEqual({ ok: false, code: 'NETWORK' });
});
