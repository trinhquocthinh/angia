import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { CreatedHealthProfile } from '@angia/contracts';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import {
  ATTESTATION,
  PROFILE_BASE,
  linkCall,
  linkToken,
  profileConsentFixture,
} from '@src/shared/test/profileConsentFixture.js';

const decide = (decision: string) => ({ decision });

describe('SPEC-040: đồng thuận qua link liên kết và tạo hồ sơ kèm tài khoản — PostgreSQL thật', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => t?.stop());
  const scenario = async (state: 'pending' | 'declined' | 'withdrawn' | 'main_attested') => {
    const f = await profileConsentFixture(t);
    const profile = await f.create(state === 'main_attested' ? { consent: ATTESTATION } : {});
    if (state === 'declined')
      await t.owner.query("UPDATE health_profiles SET consent_status='declined' WHERE id=$1", [profile.id]);
    if (state === 'withdrawn')
      await t.owner.query(
        "UPDATE health_profiles SET consent_status='withdrawn', consent_withdrawn_at=now() WHERE id=$1",
        [profile.id],
      );
    const member = await t.session(f.familyId, 'member', 'Bà M');
    return { f, profile, member, link: await f.invite(profile.id) };
  };

  it.each(['pending', 'declined', 'withdrawn'] as const)(
    'TC-574: đồng ý ở trạng thái %s → confirmed nguồn self, tên là tên tài khoản, ghi dữ liệu được ngay',
    async (state) => {
      const { f, profile, member, link } = await scenario(state);
      const view = (await (await linkCall(t, member, link.token)).json()) as { consentNote: string | null };
      expect(view.consentNote).toBe(state === 'withdrawn' ? 'withdrawn_before' : null);
      expect((await linkCall(t, member, link.token, decide('accepted'))).status).toBe(200);
      const row = (await f.snapshot(profile.id)).profile;
      expect(row).toMatchObject({
        consent_status: 'confirmed',
        consent_source: 'self',
        consent_basis: 'self',
        consent_respondent_name: 'Bà M',
        consent_confirmed_by: member.accountId,
      });
      expect(row.consent_withdrawn_at === null).toBe(state !== 'withdrawn');
      const write = await t.call(f.main, 'PUT', `${PROFILE_BASE}/${profile.id}/dose-slots`, {
        slots: { morning: '07:00' },
      });
      expect(write.status).toBe(200);
    },
  );

  it.each([
    ['main_attested', 'withdrawn'],
    ['pending', 'declined'],
    ['withdrawn', 'withdrawn'],
  ] as const)(
    'TC-575: không đồng ý với hồ sơ %s → %s, không liên kết, link đã dùng',
    async (state, expected) => {
      const { f, profile, member, link } = await scenario(state);
      const response = await linkCall(t, member, link.token, decide('declined'));
      expect(await response.json()).toMatchObject({ outcome: 'declined', consentStatus: expected });
      const saved = await f.snapshot(profile.id);
      expect(saved.invitations[0]).toMatchObject({
        decision: 'declined',
        accepted_by_account_id: member.accountId,
      });
      expect(saved.profile.consent_status).toBe(expected);
      if (state === 'main_attested') expect(saved.profile.consent_withdrawn_by).toBe(member.accountId);
      const accounts = await t.owner.query('SELECT health_profile_id FROM accounts WHERE id=$1', [
        member.accountId,
      ]);
      expect(accounts.rows[0].health_profile_id).toBeNull();
      expect((await linkCall(t, member, link.token)).status).toBe(404);
      expect((await linkCall(t, member, link.token, decide('declined'))).status).toBe(404);
      if (state === 'main_attested') {
        const write = await t.call(f.main, 'PUT', `${PROFILE_BASE}/${profile.id}/dose-slots`, {
          slots: { morning: '07:00' },
        });
        expect(await write.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
        const again = await t.call(
          f.main,
          'POST',
          `${PROFILE_BASE}/${profile.id}/consent-attestation`,
          ATTESTATION,
        );
        expect(again.status).toBe(409);
        expect(await again.json()).toMatchObject({ error: { code: 'ERR_CONSENT_INVITATION_REQUIRED' } });
      }
    },
  );

  it('TC-575: decision ngoài accepted/declined → 422, link còn nguyên', async () => {
    const { member, link } = await scenario('pending');
    for (const body of [decide('maybe'), {}, { decision: 'accepted', extra: 1 }])
      expect((await linkCall(t, member, link.token, body)).status).toBe(422);
    expect((await linkCall(t, member, link.token)).status).toBe(200);
  });

  it('TC-576: tạo hồ sơ kèm tài khoản khác → pending, chưa gắn, có linkInvitation; tài khoản đó xác nhận mới gắn', async () => {
    const f = await profileConsentFixture(t);
    const member = await t.session(f.familyId, 'member', 'Bà N');
    const created = await t.call(f.main, 'POST', PROFILE_BASE, {
      displayName: 'Bà N',
      birthYear: 1950,
      linkedAccountId: member.accountId,
    });
    expect(created.status).toBe(201);
    const body = (await created.json()) as CreatedHealthProfile;
    expect(body).toMatchObject({ consentStatus: 'pending', linkInvitation: { url: expect.any(String) } });
    const account = () =>
      t.owner.query('SELECT health_profile_id FROM accounts WHERE id=$1', [member.accountId]);
    expect((await account()).rows[0].health_profile_id).toBeNull();
    const accepted = await linkCall(t, member, linkToken(body.linkInvitation!), decide('accepted'));
    expect(accepted.status).toBe(200);
    expect((await account()).rows[0].health_profile_id).toBe(body.id);
    const mine = await t.call(f.main, 'POST', PROFILE_BASE, {
      displayName: 'Tôi',
      birthYear: 1980,
      linkedAccountId: f.main.accountId,
      consent: { kind: 'self' },
    });
    const own = (await mine.json()) as CreatedHealthProfile;
    expect(own).toMatchObject({ consentStatus: 'confirmed', consentSource: 'self' });
    expect(own.linkInvitation).toBeUndefined();
    expect(
      (await t.owner.query('SELECT health_profile_id FROM accounts WHERE id=$1', [f.main.accountId])).rows[0],
    ).toEqual({
      health_profile_id: own.id,
    });
  });

  it('TC-577: ba route link đồng thuận cũ trả 410, kể cả khi không phiên hay body cũ; cam kết main vẫn hoạt động', async () => {
    const f = await profileConsentFixture(t);
    const profile = await f.create();
    const gone = { error: { code: 'ERR_CONSENT_INVITATION_RETIRED' } };
    const created = await t.call(f.main, 'POST', `${PROFILE_BASE}/${profile.id}/consent-invitations`, {
      attestation: true,
    });
    expect(created.status).toBe(410);
    expect(await created.json()).toMatchObject(gone);
    for (const [method, path, body] of [
      ['GET', '/api/consent-invitations/view', undefined],
      [
        'POST',
        '/api/consent-invitations/respond',
        { decision: 'accepted', basis: 'self', respondentName: 'An' },
      ],
      ['POST', '/api/consent-invitations/respond', { rác: true }],
    ] as const) {
      const response = await t.app.request(path, {
        method,
        headers: { authorization: `Bearer ${randomUUID()}`, 'content-type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      expect(response.status).toBe(410);
      expect(await response.json()).toMatchObject(gone);
    }
    const attested = await t.call(
      f.main,
      'POST',
      `${PROFILE_BASE}/${profile.id}/consent-attestation`,
      ATTESTATION,
    );
    expect(attested.status).toBe(200);
  });
});
