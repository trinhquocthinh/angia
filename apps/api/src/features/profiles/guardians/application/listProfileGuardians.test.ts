import { describe, expect, it } from 'vitest';
import { listProfileGuardians } from './listProfileGuardians.js';
import type { ProfileGuardianRepository } from './ports.js';

describe('Đọc danh sách người giám hộ', () => {
  const actor = { accountId: 'an', familyId: 'nhà', role: 'main' as const };
  const repository: ProfileGuardianRepository = {
    change: async () => ({ ok: true }),
    list: async (caller, profileId) => {
      if (caller.familyId !== 'nhà' || profileId !== 'bé') return { ok: false, code: 'ERR_NOT_FOUND' };
      return { ok: true, guardians: [{ accountId: 'an', displayName: 'An', isMe: true }] };
    },
  };
  it('TC-815: main đọc danh sách của đúng hồ sơ trong nhà', async () => {
    expect(await listProfileGuardians(repository, actor, 'bé')).toEqual({
      ok: true,
      guardians: [{ accountId: 'an', displayName: 'An', isMe: true }],
    });
    expect(await listProfileGuardians(repository, actor, 'khác')).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
  });
  it('TC-815: trả danh sách rỗng khi hồ sơ không có giám hộ', async () => {
    expect(
      await listProfileGuardians(
        { ...repository, list: async () => ({ ok: true, guardians: [] }) },
        actor,
        'bé',
      ),
    ).toEqual({ ok: true, guardians: [] });
  });
  it('TC-815: chặn member và người không có nhà trước khi đọc kho', async () => {
    const denied: ProfileGuardianRepository = {
      ...repository,
      list: async () => {
        throw new Error('Không được chạm kho');
      },
    };
    for (const caller of [
      { ...actor, role: 'member' as const },
      { ...actor, familyId: null },
    ]) {
      expect(await listProfileGuardians(denied, caller, 'bé')).toEqual({ ok: false, code: 'ERR_FORBIDDEN' });
    }
  });
});
