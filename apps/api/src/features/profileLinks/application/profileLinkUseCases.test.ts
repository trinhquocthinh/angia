import { describe, expect, it } from 'vitest';
import type { LinkAccount, LinkProfile, ProfileLinkInvitation } from '../domain/ProfileLink.js';
import { acceptProfileLink } from './acceptProfileLink.js';
import { createProfileLink } from './createProfileLink.js';
import type { ProfileLinkDependencies, ProfileLinkStore, ProfileLinkTokenCodec } from './ports.js';
import { revokeProfileLink } from './revokeProfileLink.js';
import { viewProfileLink } from './viewProfileLink.js';

const familyId = '00000000-0000-4000-8000-000000000001';
const profileId = '00000000-0000-4000-8000-000000000002';
const at = new Date('2026-11-02T03:00:00Z');
// Codec giả: token = JSON claims, đủ để kiểm logic use case (mã hóa thật đã có test riêng).
const codec: ProfileLinkTokenCodec = {
  issue: (claims) => `v1.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.${Math.random()}`,
  verify: (token) => {
    try {
      return JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString());
    } catch {
      return null;
    }
  },
  hash: (token) => `hash:${token}`,
};

function setup(profile: Partial<LinkProfile> = {}, accountOverride: Partial<LinkAccount> = {}) {
  const state = {
    profile: {
      id: profileId,
      displayName: 'Mẹ',
      consentStatus: 'pending',
      consentWithdrawnAt: null,
      ...profile,
    } as LinkProfile,
    account: { id: 'acc-m', displayName: 'Bà M', healthProfileId: null, ...accountOverride } as LinkAccount,
    linked: null as { id: string } | null,
    invitations: [] as ProfileLinkInvitation[],
    calls: [] as string[],
  };
  const store: ProfileLinkStore = {
    lockProfile: async (id) => (id === profileId ? state.profile : null),
    findLinkedAccount: async () => state.linked,
    lockInvitation: async (c) => state.invitations.find((i) => i.id === c.invitationId) ?? null,
    lockAccount: async (id) => (id === state.account.id ? state.account : null),
    accountName: async () => 'Người chăm',
    revokePending: async (_p, when) => {
      for (const i of state.invitations) if (!i.revokedAt && !i.acceptedAt) i.revokedAt = when;
    },
    insertInvitation: async (i) => void state.invitations.push(i),
    markDecided: async (id, _a, decision, when) => {
      state.invitations.find((i) => i.id === id)!.acceptedAt = when;
      state.calls.push(`decided:${decision}`);
    },
    applyConsent: async (_p, patch) => void state.calls.push(`consent:${patch.consentStatus}`),
    linkAccount: async () => void state.calls.push('link'),
    clearReminderRecipients: async () => void state.calls.push('clearRecipients'),
    revokeConsentInvitations: async () => void state.calls.push('revokeConsent'),
    recordLinkEvent: async () => void state.calls.push('event'),
  };
  let n = 0;
  const deps: ProfileLinkDependencies = {
    repository: { withFamily: (_f, work) => work(store) },
    codec,
    now: () => at,
    newId: () => `00000000-0000-4000-8000-0000000001${String(n++).padStart(2, '0')}`,
    appBaseUrl: 'http://app.test',
  };
  const create = async () => {
    const r = await createProfileLink(deps, familyId, profileId, 'acc-main');
    if (!r.ok) throw new Error(r.code);
    return r.value.url.split('#')[1]!;
  };
  return { state, deps, create };
}

describe('Link liên kết kiêm đồng thuận (SPEC-040)', () => {
  it.each(['pending', 'declined', 'confirmed', 'withdrawn'] as const)(
    'TC-455: tạo link khi hồ sơ %s, token nằm ở fragment, hạn 7 ngày, không đổi đồng thuận',
    async (consentStatus) => {
      const { state, deps } = setup({ consentStatus });
      const r = await createProfileLink(deps, familyId, profileId, 'acc-main');
      expect(r).toMatchObject({ ok: true, value: { expiresAt: new Date(at.getTime() + 7 * 86400000) } });
      expect(r.ok && r.value.url).toMatch(/^http:\/\/app\.test\/link-invite#v1\./);
      expect(state.profile.consentStatus).toBe(consentStatus);
      expect(state.invitations[0]!.tokenHash).toMatch(/^hash:v1\./);
    },
  );
  it('TC-454: hồ sơ đã có tài khoản liên kết → ERR_PROFILE_ALREADY_LINKED; hồ sơ lạ → ERR_NOT_FOUND', async () => {
    const { state, deps } = setup();
    state.linked = { id: 'x' };
    expect(await createProfileLink(deps, familyId, profileId, 'acc-main')).toEqual({
      ok: false,
      code: 'ERR_PROFILE_ALREADY_LINKED',
    });
    expect(await createProfileLink(deps, familyId, 'other', 'acc-main')).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
  });
  it('TC-456: tạo link B thu hồi link A; thu hồi idempotent', async () => {
    const { state, deps, create } = setup();
    const a = await create();
    const b = await create();
    expect(await viewProfileLink(deps, a, 'acc-m')).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    expect((await viewProfileLink(deps, b, 'acc-m')).ok).toBe(true);
    expect(await revokeProfileLink(deps, familyId, profileId)).toEqual({ ok: true, value: null });
    expect(await revokeProfileLink(deps, familyId, profileId)).toEqual({ ok: true, value: null });
    expect(state.invitations.every((i) => i.revokedAt)).toBe(true);
  });
  it('TC-450/453: xem không tiêu thụ, không lộ dữ liệu sức khỏe', async () => {
    const { state, deps, create } = setup();
    const token = await create();
    const view = await viewProfileLink(deps, token, 'acc-m');
    expect(view).toEqual({
      ok: true,
      value: {
        profileName: 'Mẹ',
        inviterName: 'Người chăm',
        expiresAt: new Date(at.getTime() + 7 * 86400000),
        canAccept: true,
        reason: null,
        consentNote: null,
      },
    });
    expect(state.invitations[0]!.acceptedAt).toBeNull();
  });
  it('TC-574: link của hồ sơ đã rút đồng thuận trả consentNote = withdrawn_before', async () => {
    const { deps, create } = setup({ consentStatus: 'withdrawn', consentWithdrawnAt: at });
    const view = await viewProfileLink(deps, await create(), 'acc-m');
    expect(view.ok && view.value.consentNote).toBe('withdrawn_before');
  });
  it.each([['tài khoản đã liên kết hồ sơ khác', { healthProfileId: 'other' }, 'account_already_linked']])(
    'TC-454: xem khi %s → canAccept=false',
    async (_n, override, reason) => {
      const { deps, create } = setup({}, override);
      const view = await viewProfileLink(deps, await create(), 'acc-m');
      expect(view).toMatchObject({ ok: true, value: { canAccept: false, reason } });
    },
  );
  it('TC-453: token sai, hết hạn, đã dùng, tài khoản khác gia đình → 404 như nhau', async () => {
    const { state, deps, create } = setup();
    const token = await create();
    const notFound = { ok: false, code: 'ERR_NOT_FOUND' };
    expect(await acceptProfileLink(deps, 'bogus', 'acc-m', 'accepted')).toEqual(notFound);
    expect(await acceptProfileLink(deps, token, 'acc-lạ', 'accepted')).toEqual(notFound);
    expect(await viewProfileLink(deps, token, 'acc-lạ')).toEqual(notFound);
    const late = { ...deps, now: () => new Date(at.getTime() + 7 * 86400000) };
    expect(await acceptProfileLink(late, token, 'acc-m', 'accepted')).toEqual(notFound);
    expect((await acceptProfileLink(deps, token, 'acc-m', 'accepted')).ok).toBe(true);
    state.account.healthProfileId = null;
    expect(await acceptProfileLink(deps, token, 'acc-m', 'accepted')).toEqual(notFound);
  });
  it('TC-450/451: đồng ý → confirmed, gắn tài khoản, xóa người nhận nhắc, ghi sự kiện, link đã dùng', async () => {
    const { state, deps, create } = setup();
    const r = await acceptProfileLink(deps, await create(), 'acc-m', 'accepted');
    expect(r).toEqual({
      ok: true,
      value: { outcome: 'linked', profileId, profileName: 'Mẹ', consentStatus: 'confirmed' },
    });
    expect(state.calls).toEqual([
      'consent:confirmed',
      'decided:accepted',
      'revokeConsent',
      'link',
      'clearRecipients',
      'event',
    ]);
  });
  it('TC-454: token còn hạn nhưng tài khoản đã liên kết hoặc hồ sơ vừa được liên kết → 409, không đổi gì', async () => {
    const { state, deps, create } = setup({}, { healthProfileId: 'other' });
    const token = await create();
    const conflict = { ok: false, code: 'ERR_PROFILE_ALREADY_LINKED' };
    expect(await acceptProfileLink(deps, token, 'acc-m', 'accepted')).toEqual(conflict);
    state.account.healthProfileId = null;
    state.linked = { id: 'x' };
    expect(await acceptProfileLink(deps, token, 'acc-m', 'declined')).toEqual(conflict);
    expect(state.calls).toEqual([]);
    expect(state.invitations[0]!.acceptedAt).toBeNull();
  });
  it('TC-575: không đồng ý → không liên kết, link đã dùng, confirmed → withdrawn', async () => {
    const { state, deps, create } = setup({ consentStatus: 'confirmed' });
    const r = await acceptProfileLink(deps, await create(), 'acc-m', 'declined');
    expect(r).toMatchObject({ ok: true, value: { outcome: 'declined', consentStatus: 'withdrawn' } });
    expect(state.calls).toEqual(['consent:withdrawn', 'decided:declined', 'revokeConsent']);
  });
  it('TC-575: không đồng ý với hồ sơ đã withdrawn giữ nguyên trạng thái', async () => {
    const { state, deps, create } = setup({ consentStatus: 'withdrawn', consentWithdrawnAt: at });
    const r = await acceptProfileLink(deps, await create(), 'acc-m', 'declined');
    expect(r).toMatchObject({ ok: true, value: { consentStatus: 'withdrawn' } });
    expect(state.calls).toEqual(['decided:declined', 'revokeConsent']);
  });
});
