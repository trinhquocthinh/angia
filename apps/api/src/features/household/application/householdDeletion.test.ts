import { describe, expect, it } from 'vitest';
import { requestHouseholdDeletion } from './requestHouseholdDeletion.js';
import { revokeHouseholdDeletion } from './revokeHouseholdDeletion.js';
import type { HouseholdDeletionRepository } from './deletionPorts.js';

const actor = { accountId: 'owner', familyId: 'family', role: 'main' as const };
const unavailable: HouseholdDeletionRepository = {
  current: async () => ({ ok: false, code: 'ERR_NOT_FOUND' }),
  request: async () => {
    throw new Error('Không được truy cập kho');
  },
  revoke: async () => {
    throw new Error('Không được truy cập kho');
  },
};
describe('SPEC-069: điều phối yêu cầu xoá nhà', () => {
  it('TC-808: chặn chưa có nhà và vai trò member trước khi vào kho', async () => {
    for (const input of [
      { ...actor, familyId: null },
      { ...actor, role: 'member' as const },
    ]) {
      expect(await requestHouseholdDeletion(unavailable, input, 'Nhà')).toEqual({
        ok: false,
        code: 'ERR_FORBIDDEN',
      });
      expect(await revokeHouseholdDeletion(unavailable, input, 'request')).toEqual({
        ok: false,
        code: 'ERR_FORBIDDEN',
      });
    }
  });
  it('TC-804: chuyển tác vụ vào kho và giữ nguyên kết quả kiểm lại từ DB', async () => {
    const executeAt = new Date(0);
    const repository: HouseholdDeletionRepository = {
      current: async () => ({ ok: false, code: 'ERR_NOT_FOUND' }),
      request: async (_input, name) =>
        name === 'Nhà'
          ? { ok: true, request: { id: 'request', status: 'pending', executeAt } }
          : { ok: false, code: 'ERR_VALIDATION' },
      revoke: async () => ({ ok: false, code: 'ERR_NOT_FOUND' }),
    };
    expect(await requestHouseholdDeletion(repository, actor, 'Nhà')).toMatchObject({
      ok: true,
      request: { id: 'request', executeAt },
    });
    expect(await requestHouseholdDeletion(repository, actor, 'Khác')).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
    expect(await revokeHouseholdDeletion(repository, actor, 'request')).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
  });
});
