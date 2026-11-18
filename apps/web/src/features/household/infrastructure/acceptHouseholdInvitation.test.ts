import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '@src/shared/api/apiClient';
import { acceptHouseholdInvitation } from './acceptHouseholdInvitation';

vi.mock('@src/shared/api/apiClient', () => ({ apiClient: { POST: vi.fn() } }));
afterEach(() => vi.resetAllMocks());
it('TC-775: gửi mã qua body và CSRF, 204 không cần response body', async () => {
  vi.mocked(apiClient.POST).mockResolvedValue({ response: new Response(null, { status: 204 }) });
  expect(await acceptHouseholdInvitation({ token: 'A7F29C4E8B1D' }, 'csrf')).toEqual({ ok: true });
  expect(apiClient.POST).toHaveBeenCalledWith('/api/invitations/accept', {
    body: { token: 'A7F29C4E8B1D' },
    headers: { 'X-CSRF-Token': 'csrf' },
  });
});
it('TC-777: giữ mã lỗi, không đưa message nội bộ ra UI', async () => {
  vi.mocked(apiClient.POST).mockResolvedValue({
    response: new Response(null, { status: 404 }),
    error: { error: { code: 'ERR_NOT_FOUND', message: 'Thông tin nội bộ' } },
  });
  expect(await acceptHouseholdInvitation({ token: 'A7F29C4E8B1D' }, 'csrf')).toEqual({
    ok: false,
    code: 'ERR_NOT_FOUND',
  });
});
