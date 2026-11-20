import { describe, expect, it } from 'vitest';
import { addProfileGuardian } from './addProfileGuardian.js';
import { removeOwnProfileGuardian } from './removeOwnProfileGuardian.js';
import type { ProfileGuardianRepository } from './ports.js';

describe('Điều phối thay đổi giám hộ', () => {
  it('TC-810/811: main có nhà thêm và chỉ tự gỡ theo actor từ phiên', async () => {
    const ids = new Set(['an']);
    const repository: ProfileGuardianRepository = {
      list: async () => ({ ok: true, guardians: [] }),
      change: async (actor, _profileId, target) => {
        if (target === null) ids.delete(actor.accountId);
        else ids.add(target);
        return { ok: true };
      },
    };
    const actor = { accountId: 'an', familyId: 'nhà', role: 'main' as const };
    expect(await addProfileGuardian(repository, actor, 'bé', 'bình')).toEqual({ ok: true });
    expect([...ids]).toEqual(['an', 'bình']);
    expect(await removeOwnProfileGuardian(repository, actor, 'bé')).toEqual({ ok: true });
    expect([...ids]).toEqual(['bình']);
  });
  it('TC-813: từ chối trước transaction khi không có nhà hoặc không phải main', async () => {
    const repository: ProfileGuardianRepository = {
      list: async () => ({ ok: true, guardians: [] }),
      change: () => {
        throw new Error('Không được chạm kho');
      },
    };
    for (const actor of [
      { accountId: 'an', familyId: null, role: 'main' as const },
      { accountId: 'an', familyId: 'nhà', role: 'member' as const },
    ]) {
      expect(await addProfileGuardian(repository, actor, 'bé', 'bình')).toEqual({
        ok: false,
        code: 'ERR_FORBIDDEN',
      });
      expect(await removeOwnProfileGuardian(repository, actor, 'bé')).toEqual({
        ok: false,
        code: 'ERR_FORBIDDEN',
      });
    }
  });
});
