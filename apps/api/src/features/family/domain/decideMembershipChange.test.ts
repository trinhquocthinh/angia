import { describe, expect, it } from 'vitest';
import { decideMembershipChange } from './decideMembershipChange.js';

const LAST_MAIN = { ok: false, code: 'ERR_LAST_MAIN' } as const;

describe('decideMembershipChange', () => {
  it('nhóm còn main khác thì được hạ vai trò hoặc gỡ một main', () => {
    const change = { action: 'change_role', role: 'member' } as const;
    expect(decideMembershipChange({ currentRole: 'main', mainCount: 2, change })).toEqual({ ok: true });
    expect(
      decideMembershipChange({ currentRole: 'main', mainCount: 2, change: { action: 'remove' } }),
    ).toEqual({ ok: true });
  });

  it('main cuối cùng không được gỡ khỏi nhóm hay hạ thành member (BR-007)', () => {
    expect(
      decideMembershipChange({ currentRole: 'main', mainCount: 1, change: { action: 'remove' } }),
    ).toEqual(LAST_MAIN);
    expect(
      decideMembershipChange({
        currentRole: 'main',
        mainCount: 1,
        change: { action: 'change_role', role: 'member' },
      }),
    ).toEqual(LAST_MAIN);
  });

  it('giữ nguyên vai trò main của main cuối cùng là thao tác hợp lệ', () => {
    const change = { action: 'change_role', role: 'main' } as const;
    expect(decideMembershipChange({ currentRole: 'main', mainCount: 1, change })).toEqual({ ok: true });
  });

  it('member luôn được gỡ hoặc nâng lên main', () => {
    const promote = { action: 'change_role', role: 'main' } as const;
    expect(decideMembershipChange({ currentRole: 'member', mainCount: 1, change: promote })).toEqual({
      ok: true,
    });
    expect(
      decideMembershipChange({ currentRole: 'member', mainCount: 1, change: { action: 'remove' } }),
    ).toEqual({ ok: true });
  });
});
