import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { ATTESTATION, linkCall, profileConsentFixture } from '@src/shared/test/profileConsentFixture.js';

const accept = { decision: 'accepted' };

describe('SPEC-040: link liên kết kiêm đồng thuận — PostgreSQL thật và NOBYPASSRLS', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => t?.stop());
  const setup = async (input: object = { consent: ATTESTATION }) => {
    const f = await profileConsentFixture(t);
    const profile = await f.create(input);
    const member = await t.session(f.familyId, 'member', 'Bà M');
    return { f, profile, member, link: await f.invite(profile.id) };
  };

  it('TC-450/451: xem không tiêu thụ; xác nhận gắn tài khoản, nâng nguồn self, xóa người nhận nhắc', async () => {
    const { f, profile, member, link } = await setup();
    expect(new Date(link.expiresAt).getTime() - Date.now()).toBeGreaterThan(7 * 86400000 - 10000);
    expect(link.url).toBe(`http://localhost:5173/link-invite#token=${link.token}`);
    await t.owner.query(
      'INSERT INTO reminder_recipients(health_profile_id,family_id,account_id) VALUES($1,$2,$3)',
      [profile.id, f.familyId, f.main.accountId],
    );
    const view = await linkCall(t, member, link.token);
    expect(view.headers.get('cache-control')).toBe('no-store');
    expect(await view.json()).toEqual({
      profileName: 'Bé An',
      inviterName: 'Người chăm',
      expiresAt: link.expiresAt,
      canAccept: true,
      reason: null,
      consentNote: null,
    });
    expect((await linkCall(t, member, link.token)).status).toBe(200);
    const done = await linkCall(t, member, link.token, accept);
    expect(await done.json()).toEqual({
      outcome: 'linked',
      profileId: profile.id,
      profileName: 'Bé An',
      consentStatus: 'confirmed',
    });
    const saved = await f.snapshot(profile.id);
    expect(saved.profile).toMatchObject({
      consent_source: 'self',
      consent_basis: 'self',
      consent_respondent_name: 'Bà M',
      consent_confirmed_by: member.accountId,
    });
    expect(saved.invitations[0]).toMatchObject({
      decision: 'accepted',
      accepted_by_account_id: member.accountId,
    });
    const linked = await t.owner.query('SELECT health_profile_id FROM accounts WHERE id=$1', [
      member.accountId,
    ]);
    expect(linked.rows[0].health_profile_id).toBe(profile.id);
    expect(
      (await t.owner.query('SELECT action, actor_role, to_account_id FROM profile_link_events')).rows.filter(
        (r) => r.to_account_id === member.accountId,
      ),
    ).toEqual([{ action: 'link', actor_role: 'invitee', to_account_id: member.accountId }]);
    const recipients = await t.call(f.main, 'GET', `/api/health-profiles/${profile.id}/reminder-recipients`);
    expect(await recipients.json()).toMatchObject({
      mode: 'linked',
      recipients: [{ accountId: member.accountId, displayName: 'Bà M' }],
    });
    expect(
      (await t.pool.query('SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0]
        .rolbypassrls,
    ).toBe(false);
  });

  it('TC-452: hai tài khoản xác nhận đồng thời — đúng một 200, lệnh kia 404', async () => {
    const { f, member, link } = await setup();
    const other = await t.session(f.familyId, 'member', 'Bà N');
    const results = await Promise.all([
      linkCall(t, member, link.token, accept),
      linkCall(t, other, link.token, accept),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 404]);
  });

  it('TC-453: đã dùng, hết hạn, thu hồi, token giả, gia đình khác — mọi trường hợp 404 giống hệt', async () => {
    const { f, profile, member, link } = await setup();
    const outsider = await t.session(await t.family(), 'main', 'Người lạ');
    const bogus = await linkCall(t, member, 'bogus');
    const expected = { status: 404, body: await bogus.json() };
    const probe = async (user = member, token = link.token) => {
      const responses = [await linkCall(t, user, token), await linkCall(t, user, token, accept)];
      return Promise.all(responses.map(async (r) => ({ status: r.status, body: await r.json() })));
    };
    expect(await probe(outsider)).toEqual([expected, expected]);
    await t.owner.query("UPDATE profile_link_invitations SET expires_at = now() - interval '1 second'");
    expect(await probe()).toEqual([expected, expected]);
    const fresh = await f.invite(profile.id);
    expect(
      (await t.call(f.main, 'DELETE', `/api/health-profiles/${profile.id}/link-invitations`)).status,
    ).toBe(204);
    expect(
      (await t.call(f.main, 'DELETE', `/api/health-profiles/${profile.id}/link-invitations`)).status,
    ).toBe(204);
    expect(await probe(member, fresh.token)).toEqual([expected, expected]);
    const last = await f.invite(profile.id);
    expect((await linkCall(t, member, last.token, accept)).status).toBe(200);
    expect(await probe(member, last.token)).toEqual([expected, expected]);
    const noSession = await t.app.request('/api/me/link-invitations/view', {
      headers: { authorization: `Bearer ${last.token}` },
    });
    expect(noSession.status).toBe(401);
  });

  it('TC-454: tài khoản đã liên kết hồ sơ khác — 409, không đổi gì; xem báo canAccept=false', async () => {
    const { f, profile, member, link } = await setup();
    const other = await f.create({ displayName: 'Ba' });
    await t.owner.query('UPDATE accounts SET health_profile_id=$2 WHERE id=$1', [member.accountId, other.id]);
    const before = await f.snapshot(profile.id);
    expect(await (await linkCall(t, member, link.token)).json()).toMatchObject({
      canAccept: false,
      reason: 'account_already_linked',
    });
    const response = await linkCall(t, member, link.token, accept);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_PROFILE_ALREADY_LINKED' } });
    expect(await f.snapshot(profile.id)).toEqual(before);
  });

  it.each(['pending', 'declined', 'confirmed', 'withdrawn'] as const)(
    'TC-455: tạo link khi hồ sơ %s trả 201 và không đổi đồng thuận; hồ sơ đã liên kết → 409',
    async (status) => {
      const f = await profileConsentFixture(t);
      const profile = await f.create();
      await t.owner.query(
        `UPDATE health_profiles SET consent_status=$2,
         consent_source=CASE WHEN $2 IN ('confirmed','withdrawn') THEN 'main_attested' END,
         consent_confirmed_at=CASE WHEN $2 IN ('confirmed','withdrawn') THEN now() END,
         consent_confirmed_by=CASE WHEN $2 IN ('confirmed','withdrawn') THEN $3::uuid END,
         consent_basis=CASE WHEN $2 IN ('confirmed','withdrawn') THEN 'guardian' END,
         consent_respondent_name=CASE WHEN $2 IN ('confirmed','withdrawn') THEN 'Mẹ' END,
         consent_withdrawn_at=CASE WHEN $2='withdrawn' THEN now() END,
         consent_withdrawn_by=CASE WHEN $2='withdrawn' THEN $3::uuid END WHERE id=$1`,
        [profile.id, status, f.main.accountId],
      );
      const before = (await f.snapshot(profile.id)).profile;
      await f.invite(profile.id);
      expect((await f.snapshot(profile.id)).profile).toEqual(before);
      const member = await t.session(f.familyId, 'member');
      await t.owner.query('UPDATE accounts SET health_profile_id=$2 WHERE id=$1', [
        member.accountId,
        profile.id,
      ]);
      const again = await t.call(f.main, 'POST', `/api/health-profiles/${profile.id}/link-invitations`, {});
      expect(again.status).toBe(409);
      expect(
        await t.call(member, 'POST', `/api/health-profiles/${profile.id}/link-invitations`, {}),
      ).toHaveProperty('status', 403);
    },
  );

  it('TC-456: main tạo link B thì link A bị thu hồi; body khác {} bị từ chối', async () => {
    const { f, profile, member, link } = await setup();
    const second = await f.invite(profile.id);
    expect((await linkCall(t, member, link.token)).status).toBe(404);
    expect((await linkCall(t, member, second.token)).status).toBe(200);
    const path = `/api/health-profiles/${profile.id}/link-invitations`;
    expect((await t.call(f.main, 'POST', path, { extra: 1 })).status).toBe(422);
    expect(
      (await t.call(f.main, 'POST', `/api/health-profiles/${randomUUID()}/link-invitations`, {})).status,
    ).toBe(404);
  });
});
