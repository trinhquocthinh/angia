import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '@src/shared/api/apiClient';
import { managedInvitationRepository as repository } from './managedInvitationRepository';
vi.mock('@src/shared/api/apiClient', () => ({ apiClient: { GET: vi.fn(), POST: vi.fn() } }));
afterEach(() => vi.resetAllMocks());
it('TC-773: đọc danh sách có phân trang, thay mã gửi đúng ID/CSRF/body', async () => {
  const list = { items: [], hasMore: false };
  vi.mocked(apiClient.GET).mockResolvedValue({ response: new Response(null, { status: 200 }), data: list });
  expect(await repository.list(50)).toEqual({ ok: true, value: list });
  expect(apiClient.GET).toHaveBeenCalledWith('/api/family/invitations', {
    params: { query: { offset: 50 } },
  });
  vi.mocked(apiClient.POST).mockResolvedValue({
    response: new Response(null, { status: 404 }),
    error: { error: { code: 'ERR_NOT_FOUND', message: 'Nội bộ' } },
  });
  expect(await repository.replace('id', 'csrf')).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
  expect(apiClient.POST).toHaveBeenCalledWith('/api/family/invitations/{id}/replace', {
    params: { path: { id: 'id' } },
    body: {},
    headers: { 'X-CSRF-Token': 'csrf' },
  });
});
it('TC-773: lỗi mạng không trả chi tiết nội bộ hoặc giả thành danh sách rỗng', async () => {
  vi.mocked(apiClient.GET).mockRejectedValue(new Error('private'));
  vi.mocked(apiClient.POST).mockRejectedValue(new Error('private'));
  expect(await repository.list(0)).toEqual({ ok: false, code: 'NETWORK' });
  expect(await repository.replace('id', 'csrf')).toEqual({ ok: false, code: 'NETWORK' });
});
