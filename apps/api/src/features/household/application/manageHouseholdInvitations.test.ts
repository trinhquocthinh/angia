import { expect, it, vi } from 'vitest';
import { manageHouseholdInvitations } from './manageHouseholdInvitations.js';
it('TC-774: người chưa có nhà hoặc member không được quản lý lời mời', async () => {
  const list = vi.fn();
  for (const actor of [
    { accountId: 'a', familyId: null, role: 'main' as const },
    { accountId: 'a', familyId: 'f', role: 'member' as const },
  ])
    expect(
      await manageHouseholdInvitations(
        { repository: { list } as never, appBaseUrl: 'https://example.test' },
        actor,
        0,
      ),
    ).toEqual({ ok: false, code: 'ERR_FORBIDDEN' });
  expect(list).not.toHaveBeenCalled();
});
it('TC-773: trả metadata và link fragment từ bí mật do repository cho phép', async () => {
  const at = new Date('2026-11-18T00:00:00Z');
  const row = {
    invitationId: 'id',
    role: 'member',
    own: true,
    status: 'active',
    createdAt: at,
    expiresAt: at,
    secrets: { token: 'secret', code: 'ABC' },
  };
  const list = vi.fn().mockResolvedValue({ ok: true, value: { items: [row], hasMore: false } });
  const result = await manageHouseholdInvitations(
    { repository: { list } as never, appBaseUrl: 'https://example.test/' },
    { accountId: 'a', familyId: 'f', role: 'main' },
    0,
  );
  expect(result).toMatchObject({
    ok: true,
    value: { items: [{ secrets: { link: 'https://example.test/invite#token=secret', code: 'ABC' } }] },
  });
});
