import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { seedMembershipProfile } from '@src/shared/test/seedMembershipProfile.js';
import { createHouseholdLeaveRepository } from '../infrastructure/createHouseholdLeaveRepository.js';

const path = '/api/family/leave';
describe('SPEC-067: nguyên tử và cạnh tranh khi rời nhà', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  const fixture = async () => {
    const family = await t.family();
    const owner = await t.session(family);
    const member = await t.session(family, 'member');
    await t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [owner.accountId, family]);
    const profile = await seedMembershipProfile(t, family, owner.accountId);
    await t.owner.query('UPDATE accounts SET health_profile_id=$1 WHERE id=$2', [profile, member.accountId]);
    const key = `families/${family}/profiles/${profile}/test.jpg`;
    t.objects.set(key, { body: new Uint8Array([1]), contentType: 'image/jpeg' });
    return { family, owner, member, profile, key };
  };

  for (const target of ['audit', 'queue'] as const) {
    it(`TC-791: lỗi ${target} rollback hồ sơ, tài khoản và job; không xoá ảnh`, async () => {
      const f = await fixture();
      const table = target === 'audit' ? 'admin_audit_events' : 'pgboss.job';
      const condition = target === 'audit' ? "NEW.action='member_left'" : "NEW.name='purge-profile-objects'";
      await t.owner.query(`CREATE FUNCTION reject_leave() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN IF ${condition} THEN RAISE EXCEPTION 'Lỗi thử rollback'; END IF; RETURN NEW; END $$;
        CREATE TRIGGER reject_leave BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION reject_leave()`);
      try {
        expect((await t.call(f.member, 'POST', path, { ownProfileDisposition: 'delete' })).status).toBe(500);
        expect(
          (
            await t.owner.query('SELECT family_id,health_profile_id FROM accounts WHERE id=$1', [
              f.member.accountId,
            ])
          ).rows,
        ).toEqual([{ family_id: f.family, health_profile_id: f.profile }]);
        expect(
          (await t.owner.query('SELECT id FROM health_profiles WHERE id=$1', [f.profile])).rowCount,
        ).toBe(1);
        expect(
          (await t.owner.query("SELECT id FROM pgboss.job WHERE data->>'profileId'=$1", [f.profile]))
            .rowCount,
        ).toBe(0);
        expect(
          (
            await t.owner.query(
              "SELECT id FROM admin_audit_events WHERE actor_account_id=$1 AND action='member_left'",
              [f.member.accountId],
            )
          ).rowCount,
        ).toBe(0);
        expect(t.objects.has(f.key)).toBe(true);
      } finally {
        await t.owner.query(`DROP TRIGGER reject_leave ON ${table}; DROP FUNCTION reject_leave()`);
      }
    });
  }

  it('TC-791: xoá hồ sơ từng có cửa sổ tải sau khi bị gỡ và vào lại nhà', async () => {
    const f = await fixture();
    await t.owner.query(
      "INSERT INTO removed_member_windows(account_id,family_id,health_profile_id,removed_at,expires_at) VALUES($1,$2,$3,now(),now()+interval '168 hours')",
      [f.member.accountId, f.family, f.profile],
    );
    expect((await t.call(f.member, 'POST', path, { ownProfileDisposition: 'delete' })).status).toBe(204);
    expect(
      (
        await t.owner.query(
          'SELECT health_profile_id FROM removed_member_windows WHERE account_id=$1 AND family_id=$2',
          [f.member.accountId, f.family],
        )
      ).rows,
    ).toEqual([{ health_profile_id: null }]);
    expect((await t.owner.query('SELECT id FROM health_profiles WHERE id=$1', [f.profile])).rowCount).toBe(0);
  });

  it('TC-795: hai người giám hộ rời đồng thời chỉ một người được rời', async () => {
    const f = await fixture();
    const guardians = [await t.session(f.family), await t.session(f.family)];
    const child = await seedMembershipProfile(t, f.family, f.owner.accountId, new Date().getFullYear() - 5);
    for (const guardian of guardians)
      await t.owner.query(
        'INSERT INTO profile_guardians(health_profile_id,family_id,account_id) VALUES($1,$2,$3)',
        [child, f.family, guardian.accountId],
      );
    const responses = await Promise.all(guardians.map((guardian) => t.call(guardian, 'POST', path, {})));
    expect(responses.map((r) => r.status).sort()).toEqual([204, 409]);
    expect(
      (await t.owner.query('SELECT * FROM profile_guardians WHERE health_profile_id=$1', [child])).rowCount,
    ).toBe(1);
  });

  it('TC-790: hai lệnh rời cùng tài khoản chỉ ghi đúng một audit', async () => {
    const f = await fixture();
    const responses = await Promise.all(
      [0, 1].map(() => t.call(f.member, 'POST', path, { ownProfileDisposition: 'keep' })),
    );
    expect(responses.map((r) => r.status).sort()).toEqual([204, 403]);
    expect(
      (
        await t.owner.query(
          "SELECT id FROM admin_audit_events WHERE actor_account_id=$1 AND action='member_left'",
          [f.member.accountId],
        )
      ).rowCount,
    ).toBe(1);
  });

  it('TC-793: quyền Chủ hộ được đọc lại từ DB, không tin actor cũ', async () => {
    const f = await fixture();
    const repository = createHouseholdLeaveRepository(t.database, t.boss);
    expect(
      await repository.leave({ accountId: f.owner.accountId, familyId: f.family, role: 'member' }, {}),
    ).toEqual({ ok: false, code: 'ERR_OWNER_MUST_TRANSFER' });
    await t.owner.query(
      'UPDATE accounts SET family_id=null,family_role=null,health_profile_id=null WHERE id=$1',
      [f.member.accountId],
    );
    expect(
      await repository.leave({ accountId: f.member.accountId, familyId: f.family, role: 'member' }, {}),
    ).toEqual({ ok: false, code: 'ERR_FORBIDDEN' });
  });
});
