import { describe, expect, it } from 'vitest';
import type { LinkAccount } from '../domain/ProfileLink.js';
import type { ProfileLinkDependencies, ProfileLinkStore } from './ports.js';
import { setLinkedAccount } from './setLinkedAccount.js';
import { unlinkOwnProfile } from './unlinkOwnProfile.js';

const at = new Date('2026-11-02T03:00:00Z');
const PROFILE = 'p-1';

function setup(accounts: LinkAccount[], linkedId: string | null) {
  const calls: unknown[][] = [];
  const log =
    (name: string) =>
    async (...args: unknown[]) => {
      calls.push([name, ...args]);
    };
  const store = {
    lockProfile: async (id: string) => (id === PROFILE ? { id, displayName: 'Mẹ' } : null),
    lockAccount: async (id: string) => accounts.find((a) => a.id === id) ?? null,
    findLinkedAccount: async () => (linkedId ? { id: linkedId } : null),
    unlinkAccount: log('unlink'),
    linkAccount: log('link'),
    clearReminderRecipients: log('clear'),
    revokePending: log('revoke'),
    recordLinkEvent: log('event'),
  } as unknown as ProfileLinkStore;
  const deps = {
    repository: { withFamily: (_family: string, work: (s: ProfileLinkStore) => unknown) => work(store) },
    now: () => at,
  } as unknown as ProfileLinkDependencies;
  return { deps, calls };
}
const account = (id: string, healthProfileId: string | null = null): LinkAccount => ({
  id,
  displayName: `Tên ${id}`,
  healthProfileId,
});

describe('unlinkOwnProfile (SPEC-050)', () => {
  it('TC-560: gỡ liên kết, xóa người nhận và ghi nhật ký owner', async () => {
    const { deps, calls } = setup([account('m', PROFILE)], 'm');
    expect(await unlinkOwnProfile(deps, 'f', 'm', PROFILE)).toEqual({ ok: true, value: null });
    expect(calls).toEqual([
      ['unlink', 'm'],
      ['clear', PROFILE],
      [
        'event',
        {
          profileId: PROFILE,
          action: 'unlink',
          actorAccountId: 'm',
          actorRole: 'owner',
          fromAccountId: 'm',
          toAccountId: null,
          at,
        },
      ],
    ]);
  });

  it('TC-560: phiên cũ không còn khớp liên kết hiện tại thì 404, không ghi gì', async () => {
    const { deps, calls } = setup([account('m', null)], null);
    expect(await unlinkOwnProfile(deps, 'f', 'm', PROFILE)).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    expect(await unlinkOwnProfile(deps, 'f', 'm', 'khác')).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    expect(calls).toEqual([]);
  });
});

describe('setLinkedAccount (SPEC-050)', () => {
  const input = (accountId: string | null, profileId = PROFILE) => ({
    familyId: 'f',
    profileId,
    accountId,
    actorId: 'admin',
  });

  it('TC-562: chuyển gỡ tài khoản cũ trước rồi mới gắn tài khoản mới (health_profile_id là UNIQUE)', async () => {
    const { deps, calls } = setup([account('m', PROFILE), account('n')], 'm');
    expect(await setLinkedAccount(deps, input('n'))).toEqual({
      ok: true,
      value: { id: PROFILE, displayName: 'Mẹ', linkedAccount: { id: 'n', displayName: 'Tên n' } },
    });
    expect(calls.map(([name]) => name)).toEqual(['unlink', 'link', 'clear', 'revoke', 'event']);
    expect(calls.at(-1)?.[1]).toMatchObject({
      action: 'transfer',
      actorRole: 'admin',
      fromAccountId: 'm',
      toAccountId: 'n',
    });
  });

  it('SPEC-050: accountId null là gỡ; hồ sơ không có liên kết thì không ghi gì', async () => {
    const linked = setup([account('m', PROFILE)], 'm');
    expect(await setLinkedAccount(linked.deps, input(null))).toMatchObject({
      ok: true,
      value: { linkedAccount: null },
    });
    expect(linked.calls.at(-1)?.[1]).toMatchObject({
      action: 'unlink',
      fromAccountId: 'm',
      toAccountId: null,
    });

    const free = setup([], null);
    expect(await setLinkedAccount(free.deps, input(null))).toMatchObject({ ok: true });
    expect(free.calls).toEqual([]);
  });

  it('TC-563: đích đã liên kết → 409; đích hoặc hồ sơ không thuộc gia đình → 404; không ghi gì', async () => {
    const { deps, calls } = setup([account('m', PROFILE), account('b', 'p-2')], 'm');
    const conflict = { ok: false, code: 'ERR_PROFILE_ALREADY_LINKED' };
    const missing = { ok: false, code: 'ERR_NOT_FOUND' };
    expect(await setLinkedAccount(deps, input('b'))).toEqual(conflict);
    expect(await setLinkedAccount(deps, input('m'))).toEqual(conflict);
    expect(await setLinkedAccount(deps, input('ngoài'))).toEqual(missing);
    expect(await setLinkedAccount(deps, input(null, 'p-sai'))).toEqual(missing);
    expect(calls).toEqual([]);
  });
});
