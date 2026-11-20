import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '@src/shared/api/apiClient';
import { householdHomeRepository as repository } from './householdHomeRepository';

vi.mock('@src/shared/api/apiClient', () => ({
  apiClient: { GET: vi.fn(), POST: vi.fn(), DELETE: vi.fn() },
}));
afterEach(() => vi.resetAllMocks());

it('SPEC-068: đọc, gửi, thu hồi và phản hồi đề nghị trao quyền Chủ hộ', async () => {
  const offer = {
    id: 'offer-1',
    status: 'pending' as const,
    createdAt: '2026-11-19T08:00:00.000Z',
    offeredBy: { accountId: 'owner-1', displayName: 'Ba Minh' },
    target: { accountId: 'main-1', displayName: 'Anh Tuấn' },
  };
  vi.mocked(apiClient.GET)
    .mockResolvedValueOnce({ response: new Response(null, { status: 200 }), data: offer })
    .mockResolvedValueOnce({
      response: new Response(null, { status: 404 }),
      error: { error: { code: 'ERR_NOT_FOUND', message: 'Not found' } },
    });

  expect(await repository.getCurrentOffer()).toEqual({ ok: true, value: offer });
  expect(await repository.getCurrentOffer()).toEqual({ ok: true, value: null });

  const created = {
    id: 'offer-2',
    targetAccountId: 'main-1',
    status: 'pending' as const,
    createdAt: '2026-11-19T09:00:00.000Z',
  };
  vi.mocked(apiClient.POST)
    .mockResolvedValueOnce({ response: new Response(null, { status: 201 }), data: created })
    .mockResolvedValueOnce({ response: new Response(null, { status: 204 }) });
  vi.mocked(apiClient.DELETE).mockResolvedValueOnce({ response: new Response(null, { status: 204 }) });

  expect(await repository.sendOffer('main-1', 'csrf-1')).toEqual({ ok: true, value: created });
  expect(apiClient.POST).toHaveBeenCalledWith('/api/family/ownership-offers', {
    body: { targetAccountId: 'main-1' },
    headers: { 'X-CSRF-Token': 'csrf-1' },
  });

  expect(await repository.decideOffer('offer-1', true, 'csrf-1')).toEqual({ ok: true, value: undefined });
  expect(apiClient.POST).toHaveBeenCalledWith('/api/family/ownership-offers/{id}/decision', {
    params: { path: { id: 'offer-1' } },
    body: { accept: true },
    headers: { 'X-CSRF-Token': 'csrf-1' },
  });

  expect(await repository.revokeOffer('offer-1', 'csrf-1')).toEqual({ ok: true, value: undefined });
  expect(apiClient.DELETE).toHaveBeenCalledWith('/api/family/ownership-offers/{id}', {
    params: { path: { id: 'offer-1' } },
    headers: { 'X-CSRF-Token': 'csrf-1' },
  });
});

it('SPEC-067: gửi yêu cầu rời nhà với ownProfileDisposition và bắt lỗi 409', async () => {
  vi.mocked(apiClient.POST)
    .mockResolvedValueOnce({ response: new Response(null, { status: 204 }) })
    .mockResolvedValueOnce({
      response: new Response(null, { status: 409 }),
      error: { error: { code: 'ERR_LAST_GUARDIAN', message: 'Nội bộ', details: { profileIds: ['p1'] } } },
    });

  expect(await repository.leaveHousehold('keep', 'csrf-2')).toEqual({ ok: true, value: undefined });
  expect(apiClient.POST).toHaveBeenCalledWith('/api/family/leave', {
    body: { ownProfileDisposition: 'keep' },
    headers: { 'X-CSRF-Token': 'csrf-2' },
  });
  expect(await repository.leaveHousehold('delete', 'csrf-2')).toEqual({
    ok: false,
    error: { code: 'ERR_LAST_GUARDIAN', details: { profileIds: ['p1'] } },
  });
});

it('SPEC-069: đọc, gửi, thu hồi yêu cầu xoá nhà và giữ details của ERR_RECENT_REMOVAL', async () => {
  const request = { id: 'del-1', status: 'pending' as const, executeAt: '2026-11-20T14:30:00.000Z' };
  vi.mocked(apiClient.GET)
    .mockResolvedValueOnce({ response: new Response(null, { status: 200 }), data: request })
    .mockResolvedValueOnce({
      response: new Response(null, { status: 404 }),
      error: { error: { code: 'ERR_NOT_FOUND', message: 'None' } },
    });

  expect(await repository.getCurrentDeletionRequest()).toEqual({ ok: true, value: request });
  expect(await repository.getCurrentDeletionRequest()).toEqual({ ok: true, value: null });

  vi.mocked(apiClient.POST)
    .mockResolvedValueOnce({ response: new Response(null, { status: 201 }), data: request })
    .mockResolvedValueOnce({
      response: new Response(null, { status: 409 }),
      error: {
        error: {
          code: 'ERR_RECENT_REMOVAL',
          message: 'Cooldown',
          details: { allowedAt: '2026-11-25T09:05:00.000Z' },
        },
      },
    });
  vi.mocked(apiClient.DELETE).mockResolvedValueOnce({ response: new Response(null, { status: 204 }) });

  expect(await repository.requestDeletion('Nhà Ngọc Lan', 'csrf-3')).toEqual({ ok: true, value: request });
  expect(apiClient.POST).toHaveBeenCalledWith('/api/family/deletion-request', {
    body: { confirmFamilyName: 'Nhà Ngọc Lan' },
    headers: { 'X-CSRF-Token': 'csrf-3' },
  });
  expect(await repository.requestDeletion('Nhà Ngọc Lan', 'csrf-3')).toEqual({
    ok: false,
    error: { code: 'ERR_RECENT_REMOVAL', details: { allowedAt: '2026-11-25T09:05:00.000Z' } },
  });

  expect(await repository.revokeDeletion('del-1', 'csrf-3')).toEqual({ ok: true, value: undefined });
  expect(apiClient.DELETE).toHaveBeenCalledWith('/api/family/deletion-request', {
    body: { requestId: 'del-1' },
    headers: { 'X-CSRF-Token': 'csrf-3' },
  });
});

it('SPEC-067–069: lỗi mạng, JSON hỏng và 503 không bị coi là thành công', async () => {
  vi.mocked(apiClient.POST)
    .mockRejectedValueOnce(new TypeError('fetch failed'))
    .mockRejectedValueOnce(new SyntaxError('invalid JSON'))
    .mockResolvedValueOnce({ response: new Response(null, { status: 503 }) });
  expect(await repository.leaveHousehold('keep', 'csrf')).toEqual({ ok: false, error: { code: 'NETWORK' } });
  expect(await repository.requestDeletion('Nhà', 'csrf')).toEqual({ ok: false, error: { code: 'UNKNOWN' } });
  expect(await repository.sendOffer('target', 'csrf')).toEqual({ ok: false, error: { code: 'UNKNOWN' } });
});
