import { expect, it, vi } from 'vitest';
import { getCurrentHouseholdInvitations } from './getCurrentHouseholdInvitations.js';
it('TC-773: chỉ main có nhà được đọc; mã hết hạn không biến thành link', async () => {
  const current = vi.fn().mockResolvedValue({
    ok: true,
    value: [
      {
        invitationId: 'id',
        role: 'member',
        status: 'expired',
        expiresAt: new Date('2026-11-01'),
        code: 'ABC',
        token: null,
      },
    ],
  });
  const deps = { repository: { current } as never, appBaseUrl: 'https://example.test/' };
  const actor = { accountId: 'a', familyId: 'f', role: 'main' as const };
  expect(await getCurrentHouseholdInvitations(deps, actor)).toMatchObject({
    ok: true,
    value: { items: [{ code: 'ABC', link: null }] },
  });
  expect(await getCurrentHouseholdInvitations(deps, { ...actor, role: 'member' })).toEqual({
    ok: false,
    code: 'ERR_FORBIDDEN',
  });
  expect(current).toHaveBeenCalledOnce();
});
