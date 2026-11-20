import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { seedMembershipProfile } from '@src/shared/test/seedMembershipProfile.js';

describe('SPEC-066: gỡ thành viên và rút quyền dữ liệu', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  it('TC-785/786/787: giữ hồ sơ withdrawn, thu hồi push, ghi cửa sổ 168 giờ và chặn cookie cũ', async () => {
    const family = await t.family();
    const actor = await t.session(family);
    const target = await t.session(family, 'member');
    const profile = await seedMembershipProfile(t, family, actor.accountId);
    await t.owner.query('UPDATE accounts SET health_profile_id=$1 WHERE id=$2', [profile, target.accountId]);
    await t.owner.query(
      `INSERT INTO push_subscriptions(id,family_id,account_id,authorized_at,endpoint,endpoint_hash,p256dh,auth)
      VALUES(gen_random_uuid(),$1,$2,now(),'https://example.test/push',$3,'key','auth')`,
      [family, target.accountId, target.accountId],
    );
    const response = await t.call(actor, 'PATCH', `/api/family/members/${target.accountId}`, {
      action: 'remove',
    });
    expect(response.status).toBe(204);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(
      (
        await t.owner.query('SELECT family_id,family_role,health_profile_id FROM accounts WHERE id=$1', [
          target.accountId,
        ])
      ).rows[0],
    ).toEqual({ family_id: null, family_role: null, health_profile_id: null });
    expect(
      (
        await t.owner.query(
          'SELECT family_id,consent_status,consent_withdrawn_by FROM health_profiles WHERE id=$1',
          [profile],
        )
      ).rows[0],
    ).toEqual({ family_id: family, consent_status: 'withdrawn', consent_withdrawn_by: actor.accountId });
    expect(
      (await t.owner.query('SELECT * FROM push_subscriptions WHERE account_id=$1', [target.accountId]))
        .rowCount,
    ).toBe(0);
    const window = (
      await t.owner.query(
        `SELECT health_profile_id,removed_at,extract(epoch FROM expires_at-removed_at)::int AS seconds
      FROM removed_member_windows WHERE account_id=$1 AND family_id=$2`,
        [target.accountId, family],
      )
    ).rows[0];
    expect(window).toMatchObject({ health_profile_id: profile, seconds: 604800 });
    expect(
      (await t.owner.query('SELECT last_member_removed_at FROM families WHERE id=$1', [family])).rows[0]
        ?.last_member_removed_at,
    ).toEqual(window.removed_at);
    expect(
      (
        await t.owner.query(
          "SELECT metadata FROM admin_audit_events WHERE target_account_id=$1 AND action='member_removed'",
          [target.accountId],
        )
      ).rows[0]?.metadata,
    ).toMatchObject({ reason: 'removed_from_family' });
    const denied = await t.call(actor, 'GET', `/api/health-profiles/${profile}/measurements`);
    expect(denied.status).toBe(409);
    expect(await denied.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    expect((await t.call(target, 'GET', `/api/health-profiles/${profile}/measurements`)).status).toBe(403);
    await t.owner.query("UPDATE accounts SET family_id=$1,family_role='main' WHERE id=$2", [
      await t.family(),
      target.accountId,
    ]);
    expect((await t.call(target, 'GET', `/api/health-profiles/${profile}/measurements`)).status).toBe(404);
  });

  it('TC-788: chặn gỡ/hạ người giám hộ cuối cùng, gỡ một trong hai người thì thành công', async () => {
    const family = await t.family();
    const actor = await t.session(family);
    const target = await t.session(family);
    const profile = await seedMembershipProfile(t, family, actor.accountId, new Date().getFullYear() - 5);
    await t.owner.query(
      'INSERT INTO profile_guardians(health_profile_id,family_id,account_id) VALUES($1,$2,$3)',
      [profile, family, target.accountId],
    );
    for (const body of [{ action: 'remove' }, { action: 'change_role', role: 'member' }]) {
      const denied = await t.call(actor, 'PATCH', `/api/family/members/${target.accountId}`, body);
      expect(denied.status).toBe(409);
      expect(await denied.json()).toMatchObject({ error: { code: 'ERR_LAST_GUARDIAN' } });
    }
    await t.owner.query(
      'INSERT INTO profile_guardians(health_profile_id,family_id,account_id) VALUES($1,$2,$3)',
      [profile, family, actor.accountId],
    );
    expect(
      (
        await t.call(actor, 'PATCH', `/api/family/members/${target.accountId}`, {
          action: 'change_role',
          role: 'member',
        })
      ).status,
    ).toBe(204);
    expect(
      (await t.owner.query('SELECT account_id FROM profile_guardians WHERE health_profile_id=$1', [profile]))
        .rows,
    ).toEqual([{ account_id: actor.accountId }]);
    expect(
      (await t.call(actor, 'PATCH', `/api/family/members/${target.accountId}`, { action: 'remove' })).status,
    ).toBe(204);
  });
});
