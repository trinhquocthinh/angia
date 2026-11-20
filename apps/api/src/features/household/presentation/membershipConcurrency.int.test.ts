import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { seedMembershipProfile } from '@src/shared/test/seedMembershipProfile.js';
import { createHouseholdMembershipRepository } from '../infrastructure/createHouseholdMembershipRepository.js';

describe('SPEC-066: tính nguyên tử và cạnh tranh', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  it('TC-788: hai lệnh gỡ đồng thời không xoá hết người giám hộ', async () => {
    const family = await t.family();
    const actor = await t.session(family);
    const targets = [await t.session(family), await t.session(family)];
    const profile = await seedMembershipProfile(t, family, actor.accountId, new Date().getFullYear() - 5);
    for (const target of targets)
      await t.owner.query(
        'INSERT INTO profile_guardians(health_profile_id,family_id,account_id) VALUES($1,$2,$3)',
        [profile, family, target.accountId],
      );
    const responses = await Promise.all(
      targets.map((target) =>
        t.call(actor, 'PATCH', `/api/family/members/${target.accountId}`, { action: 'remove' }),
      ),
    );
    expect(responses.map((r) => r.status).sort()).toEqual([204, 409]);
    expect(
      (await t.owner.query('SELECT * FROM profile_guardians WHERE health_profile_id=$1', [profile])).rowCount,
    ).toBe(1);
  });

  it('TC-784: kiểm lại quyền từ DB dù actor truyền vào còn main', async () => {
    const family = await t.family();
    const actor = await t.session(family);
    const target = await t.session(family, 'member');
    await t.owner.query("UPDATE accounts SET family_role='member' WHERE id=$1", [actor.accountId]);
    const repository = createHouseholdMembershipRepository(t.database);
    expect(
      await repository.change(
        { accountId: actor.accountId, familyId: family, role: 'main' },
        target.accountId,
        { action: 'remove' },
      ),
    ).toEqual({ ok: false, code: 'ERR_FORBIDDEN' });
    expect(
      (await t.owner.query('SELECT family_id FROM accounts WHERE id=$1', [target.accountId])).rows[0]
        ?.family_id,
    ).toBe(family);
  });

  it('TC-785: lỗi ghi nhật ký rollback cả hồ sơ, membership và cửa sổ tải', async () => {
    const family = await t.family();
    const actor = await t.session(family);
    const target = await t.session(family, 'member');
    const profile = await seedMembershipProfile(t, family, actor.accountId);
    await t.owner.query('UPDATE accounts SET health_profile_id=$1 WHERE id=$2', [profile, target.accountId]);
    await t.owner.query(`CREATE FUNCTION reject_membership_audit() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.action='member_removed' THEN RAISE EXCEPTION 'Lỗi nhật ký thử'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER reject_membership_audit BEFORE INSERT ON admin_audit_events FOR EACH ROW EXECUTE FUNCTION reject_membership_audit()`);
    try {
      expect(
        (await t.call(actor, 'PATCH', `/api/family/members/${target.accountId}`, { action: 'remove' }))
          .status,
      ).toBe(500);
      expect(
        (
          await t.owner.query('SELECT family_id,health_profile_id FROM accounts WHERE id=$1', [
            target.accountId,
          ])
        ).rows[0],
      ).toEqual({ family_id: family, health_profile_id: profile });
      expect(
        (await t.owner.query('SELECT consent_status FROM health_profiles WHERE id=$1', [profile])).rows[0]
          ?.consent_status,
      ).toBe('confirmed');
      expect(
        (await t.owner.query('SELECT * FROM removed_member_windows WHERE account_id=$1', [target.accountId]))
          .rowCount,
      ).toBe(0);
      expect(
        (await t.owner.query('SELECT last_member_removed_at FROM families WHERE id=$1', [family])).rows[0]
          ?.last_member_removed_at,
      ).toBeNull();
    } finally {
      await t.owner.query(
        'DROP TRIGGER reject_membership_audit ON admin_audit_events; DROP FUNCTION reject_membership_audit()',
      );
    }
  });
});
