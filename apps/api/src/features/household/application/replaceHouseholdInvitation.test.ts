import { expect, it, vi } from 'vitest';
import { replaceHouseholdInvitation } from './replaceHouseholdInvitation.js';
it('TC-773: thay lời mời qua transaction, trả link fragment và giữ lỗi', async () => {
  const replace = vi.fn().mockResolvedValue({
    ok: true,
    value: { invitationId: 'id', token: 'secret', code: 'ABC', expiresAt: new Date() },
  });
  const deps = { repository: { replace } as never, appBaseUrl: 'https://example.test/' };
  const actor = { accountId: 'a', familyId: 'f', role: 'main' as const };
  expect(await replaceHouseholdInvitation(deps, actor, 'id')).toMatchObject({
    ok: true,
    value: { link: 'https://example.test/invite#token=secret' },
  });
  replace.mockResolvedValue({ ok: false, code: 'ERR_NOT_FOUND' });
  expect(await replaceHouseholdInvitation(deps, actor, 'id')).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
  expect(await replaceHouseholdInvitation(deps, { ...actor, role: 'member' }, 'id')).toEqual({
    ok: false,
    code: 'ERR_FORBIDDEN',
  });
  expect(replace).toHaveBeenCalledTimes(2);
});
