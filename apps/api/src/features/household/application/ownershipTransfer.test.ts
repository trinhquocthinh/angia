import { describe, expect, it } from 'vitest';
import { offerHouseholdOwnership } from './offerHouseholdOwnership.js';
import { decideHouseholdOwnership } from './decideHouseholdOwnership.js';
import { revokeHouseholdOwnership } from './revokeHouseholdOwnership.js';
import type { HouseholdOwnershipRepository } from './ownershipPorts.js';

const actor = { accountId: 'owner', familyId: 'family', role: 'main' as const };
const unavailable: HouseholdOwnershipRepository = {
  offer: async () => {
    throw new Error('Không được truy cập kho');
  },
  decide: async () => {
    throw new Error('Không được truy cập kho');
  },
  revoke: async () => {
    throw new Error('Không được truy cập kho');
  },
};
describe('SPEC-068: điều phối trao quyền Chủ hộ', () => {
  it('TC-799: chặn chưa có nhà và vai trò member trước khi vào kho', async () => {
    for (const input of [
      { ...actor, familyId: null },
      { ...actor, role: 'member' as const },
    ]) {
      expect(await offerHouseholdOwnership(unavailable, input, 'target')).toEqual({
        ok: false,
        code: 'ERR_FORBIDDEN',
      });
      expect(await decideHouseholdOwnership(unavailable, input, 'offer', true)).toEqual({
        ok: false,
        code: 'ERR_FORBIDDEN',
      });
      expect(await revokeHouseholdOwnership(unavailable, input, 'offer')).toEqual({
        ok: false,
        code: 'ERR_FORBIDDEN',
      });
    }
  });
  it('TC-797: chuyển tác vụ vào kho và giữ nguyên kết quả kiểm lại quyền', async () => {
    const repository: HouseholdOwnershipRepository = {
      offer: async (_input, target) => ({
        ok: true,
        offer: { id: 'offer', targetAccountId: target, status: 'pending', createdAt: new Date(0) },
      }),
      decide: async () => ({ ok: false, code: 'ERR_NOT_FOUND' }),
      revoke: async () => ({ ok: true }),
    };
    expect(await offerHouseholdOwnership(repository, actor, 'target')).toMatchObject({
      ok: true,
      offer: { targetAccountId: 'target' },
    });
    expect(await decideHouseholdOwnership(repository, actor, 'offer', false)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(await revokeHouseholdOwnership(repository, actor, 'offer')).toEqual({ ok: true });
  });
});
