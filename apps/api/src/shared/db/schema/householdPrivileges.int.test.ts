import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startHouseholdDatabase } from '@src/shared/test/startHouseholdDatabase.js';
import { seedHouseholdSchema } from '@src/shared/test/seedHouseholdSchema.js';
import { HOUSEHOLD_RLS_TABLES } from '@src/shared/test/householdIsolationPlan.js';
import { runMigrations } from '../runMigrations.js';

describe('E27-S2-T1: quyền app, RLS và trạng thái bảng nhà', () => {
  let t: Awaited<ReturnType<typeof startHouseholdDatabase>>;
  beforeAll(async () => {
    t = await startHouseholdDatabase();
  });
  afterAll(async () => {
    await t?.stop();
  });

  it('không có phạm vi nhà hoặc đang tự xem thì không đọc được năm bảng mới', async () => {
    const a = await t.seed();
    await seedHouseholdSchema(t.owner, a.family, a.profile, a.accounts[0]!, a.accounts[1]!);
    for (const table of HOUSEHOLD_RLS_TABLES) {
      expect((await t.app.query(`SELECT family_id FROM ${table}`)).rows).toEqual([]);
      await t.app.query('BEGIN');
      try {
        await t.app.query(
          "SELECT set_config('app.family_id',$1,true), set_config('app.self_profile_id',$2,true)",
          [a.family, a.profile],
        );
        expect((await t.app.query(`SELECT family_id FROM ${table}`)).rows).toEqual([]);
      } finally {
        await t.app.query('ROLLBACK');
      }
    }
  });

  it('app không có BYPASSRLS hoặc quyền gọi helper trigger, nhật ký chỉ INSERT và còn sau khi xoá đối tượng', async () => {
    const a = await t.seed();
    const id = randomUUID();
    await t.app.query(
      `INSERT INTO admin_audit_events(id,actor_account_id,family_id,target_account_id,target_profile_id,action)
       VALUES($1,$2::text,$3,$2::uuid,$4,'family_created')`,
      [id, a.accounts[0], a.family, a.profile],
    );
    for (const statement of ['SELECT * FROM', 'UPDATE', 'DELETE FROM', 'TRUNCATE']) {
      const suffix = statement === 'UPDATE' ? " SET action='changed'" : '';
      await expect(t.app.query(`${statement} admin_audit_events${suffix}`)).rejects.toMatchObject({
        code: '42501',
      });
    }
    await expect(
      t.app.query('SELECT validate_profile_guardians($1,false)', [a.profile]),
    ).rejects.toMatchObject({ code: '42501' });
    expect(
      (await t.app.query('SELECT rolbypassrls,rolsuper FROM pg_roles WHERE rolname=current_user')).rows,
    ).toEqual([{ rolbypassrls: false, rolsuper: false }]);
    await t.owner.query('DELETE FROM health_profiles WHERE id=$1', [a.profile]);
    await t.owner.query('DELETE FROM accounts WHERE family_id=$1', [a.family]);
    await t.owner.query('DELETE FROM families WHERE id=$1', [a.family]);
    expect(
      (await t.owner.query('SELECT family_id,target_profile_id FROM admin_audit_events WHERE id=$1', [id]))
        .rows,
    ).toEqual([{ family_id: a.family, target_profile_id: a.profile }]);
  });

  it('một pending mỗi nhà; quyết định xong cho phép đề nghị/yêu cầu mới', async () => {
    const a = await t.seed();
    const offer = () =>
      t.owner.query(
        'INSERT INTO ownership_transfer_offers(id,family_id,from_account_id,to_account_id) VALUES($1,$2,$3,$4)',
        [randomUUID(), a.family, a.accounts[0], a.accounts[1]],
      );
    await offer();
    await expect(offer()).rejects.toMatchObject({ code: '23505' });
    await t.owner.query(
      "UPDATE ownership_transfer_offers SET status='declined',decided_at=now() WHERE family_id=$1",
      [a.family],
    );
    await offer();
    const deletion = () =>
      t.owner.query(
        "INSERT INTO family_deletion_requests(id,family_id,requested_by,execute_at) VALUES($1,$2,$3,now()+interval '24 hours')",
        [randomUUID(), a.family, a.accounts[0]],
      );
    await deletion();
    await expect(deletion()).rejects.toMatchObject({ code: '23505' });
    await t.owner.query(
      "UPDATE family_deletion_requests SET status='revoked',revoked_at=now() WHERE family_id=$1",
      [a.family],
    );
    await deletion();
  });

  it('lời mời lập nhà bị RLS chặn; dữ liệu sai loại, nhận/thu hồi đồng thời và sai cửa sổ bị từ chối', async () => {
    const a = await t.seed();
    const invite = (kind: string, family: string | null, role: string | null) =>
      t.owner.query(
        `INSERT INTO family_invitations(id,kind,family_id,role,token_hash,code_hash,created_by,expires_at)
       VALUES($1,$2,$3,$4,$5,$6,$7,now()+interval '7 days')`,
        [randomUUID(), kind, family, role, randomUUID(), randomUUID(), a.accounts[0]],
      );
    for (const [kind, family, role] of [
      ['join_family', null, null],
      ['found_family', a.family, 'main'],
    ]) {
      await expect(invite(kind!, family!, role!)).rejects.toMatchObject({ code: '23514' });
    }
    await invite('found_family', null, null);
    await t.app.query('BEGIN');
    try {
      await t.app.query("SELECT set_config('app.family_id',$1,true)", [a.family]);
      expect((await t.app.query("SELECT id FROM family_invitations WHERE kind='found_family'")).rows).toEqual(
        [],
      );
    } finally {
      await t.app.query('ROLLBACK');
    }
    await expect(
      t.owner.query(
        `UPDATE family_invitations SET accepted_at=now(),accepted_by=$1,revoked_at=now() WHERE created_by=$1`,
        [a.accounts[0]],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      t.owner.query(
        "INSERT INTO removed_member_windows(account_id,family_id,expires_at) VALUES($1,$2,now()+interval '8 days')",
        [a.accounts[0], a.family],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    expect(await runMigrations(t.db.ownerUrl)).toBe(0);
  });
});
