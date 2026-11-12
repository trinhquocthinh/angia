import { describe, expect, it } from 'vitest';
import { createFakeLocalIdentityLifecycle } from './createFakeLocalIdentityLifecycle.js';

describe('Fake lifecycle local', () => {
  it('TC-904: khoá/thu hồi tăng version, mở khoá không khôi phục phiên và xoá không hồi sinh', async () => {
    const seed = {
      accountId: 'a',
      lockedAt: null,
      lockReason: null,
      credentialVersion: 1,
      sessionIds: ['s'],
      pushIds: ['p'],
    };
    const { lifecycle, records } = createFakeLocalIdentityLifecycle([seed]);
    const now = new Date('2026-11-12T01:00:00Z');
    expect(await lifecycle.lock('a', 'Lạm dụng', now)).toBe(true);
    expect(records.get('a')).toEqual({
      ...seed,
      lockedAt: now,
      lockReason: 'Lạm dụng',
      credentialVersion: 2,
      sessionIds: [],
      pushIds: [],
    });
    expect(seed.sessionIds).toEqual(['s']);
    expect(await lifecycle.unlock('a')).toBe(true);
    expect(records.get('a')).toMatchObject({
      lockedAt: null,
      lockReason: null,
      credentialVersion: 2,
      sessionIds: [],
      pushIds: [],
    });
    expect(await lifecycle.revokeAll('a')).toBe(true);
    expect(records.get('a')?.credentialVersion).toBe(3);
    expect(await lifecycle.deleteUser('a')).toBe(true);
    expect(records.has('a')).toBe(false);
    expect(await lifecycle.lock('a', 'Lạm dụng', now)).toBe(false);
    for (const action of ['unlock', 'revokeAll', 'deleteUser'] as const)
      expect(await lifecycle[action]('a')).toBe(false);
  });
});
