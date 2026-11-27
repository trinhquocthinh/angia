import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '@src/shared/api/apiClient';
import { inspectHouseholdInvitation } from './inspectHouseholdInvitation';

vi.mock('@src/shared/api/apiClient', () => ({ apiClient: { POST: vi.fn() } }));
afterEach(() => vi.resetAllMocks());
it('SPEC-065: inspect công khai chỉ gửi token qua body, không CSRF/query', async () => {
  vi.mocked(apiClient.POST).mockResolvedValue({
    response: new Response(null, { status: 200 }),
    data: { kind: 'found_family' },
  });
  expect(await inspectHouseholdInvitation({ token: 'a'.repeat(43) })).toEqual({
    ok: true,
    data: { kind: 'found_family' },
  });
  expect(apiClient.POST).toHaveBeenCalledExactlyOnceWith('/api/invitations/inspect', {
    body: { token: 'a'.repeat(43) },
  });
});
it.each([
  [404, 'ERR_NOT_FOUND'],
  [429, 'ERR_RATE_LIMITED'],
] as const)('SPEC-065: inspect %s chỉ trả mã lỗi, không lộ message nội bộ', async (status, code) => {
  vi.mocked(apiClient.POST).mockResolvedValue({
    response: new Response(null, { status }),
    error: { error: { code, message: 'Nội bộ' } },
  });
  expect(await inspectHouseholdInvitation({ token: 'a'.repeat(43) })).toEqual({ ok: false, code });
});
it('E27-AT-D1: lỗi mạng inspect thành lỗi an toàn để thử lại', async () => {
  vi.mocked(apiClient.POST).mockRejectedValue(new TypeError('Mất mạng'));
  expect(await inspectHouseholdInvitation({ token: 'a'.repeat(43) })).toEqual({ ok: false, code: 'NETWORK' });
});
