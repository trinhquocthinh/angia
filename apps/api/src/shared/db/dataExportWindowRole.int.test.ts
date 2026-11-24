import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DATA_EXPORT_ROLE, DATA_EXPORT_WINDOW_TABLES } from '@src/shared/test/expectedRlsPolicies.js';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from './runMigrations.js';

// E27-T2-D3 / TC-870: role job tải về chỉ đọc đúng hồ sơ trong cửa sổ còn hạn của tài khoản yêu cầu.
describe('TC-870: role tải về cho người bị gỡ (0051) trên PostgreSQL thật', () => {
  let db: TestDatabase;
  let owner: pg.Client;
  let app: pg.Client;
  const family = randomUUID();
  const [removed, otherRemoved, expired] = [randomUUID(), randomUUID(), randomUUID()];
  const [removedProfile, otherRemovedProfile, expiredProfile, stayingProfile] = [
    randomUUID(),
    randomUUID(),
    randomUUID(),
    randomUUID(),
  ];
  const prescriptions: Record<string, string> = {};

  const asExportRole = async (accountId: string | null, familyId: string | null, query: string) => {
    await app.query('BEGIN');
    try {
      if (accountId) await app.query(`SELECT set_config('app.export_account_id', $1, true)`, [accountId]);
      if (familyId) await app.query(`SELECT set_config('app.family_id', $1, true)`, [familyId]);
      await app.query(`SET LOCAL ROLE ${DATA_EXPORT_ROLE}`);
      return (await app.query(query)).rows;
    } finally {
      await app.query('ROLLBACK');
    }
  };
  const visibleProfiles = async (accountId: string | null, familyId: string | null = family) =>
    (await asExportRole(accountId, familyId, 'SELECT id FROM health_profiles ORDER BY id')).map(
      (row) => row.id as string,
    );
  // Không JOIN prescriptions: policy của bảng cha sẽ che lỗi ở policy prescription_items.
  const visibleItems = async (accountId: string) =>
    (await asExportRole(accountId, family, 'SELECT prescription_id FROM prescription_items')).map(
      (row) => row.prescription_id as string,
    );

  beforeAll(async () => {
    db = await startTestDatabase();
    await runMigrations(db.ownerUrl);
    owner = new pg.Client({ connectionString: db.ownerUrl });
    await owner.connect();
    app = new pg.Client({ connectionString: db.appUrl });
    await app.connect();
    await owner.query(`INSERT INTO families(id,name) VALUES($1,'Nhà cũ')`, [family]);
    for (const account of [removed, otherRemoved, expired])
      await owner.query(
        `INSERT INTO accounts(id,oidc_subject,display_name) VALUES($1::uuid,$1::text,'Người bị gỡ')`,
        [account],
      );
    for (const profile of [removedProfile, otherRemovedProfile, expiredProfile, stayingProfile]) {
      await owner.query(`INSERT INTO health_profiles(id,family_id,display_name) VALUES($1,$2,'Hồ sơ')`, [
        profile,
        family,
      ]);
      await owner.query(
        `INSERT INTO consent_legacy_attestations(profile_id,family_id,confirmed_at) VALUES($1,$2,now())`,
        [profile, family],
      );
      prescriptions[profile] = randomUUID();
      await owner.query(
        `INSERT INTO prescriptions(id,family_id,health_profile_id,issued_date,manual_without_source)
         VALUES($1,$2,$3,'2026-11-01',true)`,
        [prescriptions[profile], family, profile],
      );
      await owner.query(
        `INSERT INTO prescription_items(id,family_id,prescription_id,position,name,name_normalized,quantity_per_dose,slots,duration_days,long_term)
         VALUES($1,$2,$3,0,'Canxi','canxi',1,ARRAY['morning'],7,false)`,
        [randomUUID(), family, prescriptions[profile]],
      );
    }
    const windows: [string, string, string][] = [
      [removed, removedProfile, '3 days'],
      [otherRemoved, otherRemovedProfile, '1 day'],
      [expired, expiredProfile, '8 days'],
    ];
    for (const [account, profile, ago] of windows)
      await owner.query(
        `INSERT INTO removed_member_windows(account_id,family_id,health_profile_id,removed_at,expires_at)
         VALUES($1,$2,$3,now() - $4::interval,now() - $4::interval + interval '168 hours')`,
        [account, family, profile, ago],
      );
  });
  afterAll(async () => {
    await app?.end();
    await owner?.end();
    await db?.container.stop();
  });

  it('role NOLOGIN, NOBYPASSRLS; app chỉ SET vào, không INHERIT', async () => {
    const { rows } = await owner.query(
      `SELECT r.rolcanlogin, r.rolbypassrls, m.inherit_option, m.set_option FROM pg_roles r
       JOIN pg_auth_members m ON m.roleid = r.oid AND m.member = 'angia_test_app'::regrole
       WHERE r.rolname = $1`,
      [DATA_EXPORT_ROLE],
    );
    expect(rows).toEqual([
      { rolcanlogin: false, rolbypassrls: false, inherit_option: false, set_option: true },
    ]);
  });

  it('liệt kê được cửa sổ còn hạn của chính mình khi chưa vào nhà cũ, không thấy cửa sổ người khác', async () => {
    const rows = await asExportRole(
      removed,
      null,
      'SELECT family_id, health_profile_id FROM removed_member_windows',
    );
    expect(rows).toEqual([{ family_id: family, health_profile_id: removedProfile }]);
  });

  it('trong cửa sổ: chỉ đọc đúng hồ sơ cũ của mình, không đọc hồ sơ khác của nhà cũ', async () => {
    expect(await visibleProfiles(removed)).toEqual([removedProfile]);
    expect(await asExportRole(removed, family, 'SELECT profile_id FROM consent_legacy_attestations')).toEqual(
      [{ profile_id: removedProfile }],
    );
    expect(await visibleItems(removed)).toEqual([prescriptions[removedProfile]]);
  });

  it('cửa sổ đã quá 7 ngày, thiếu tài khoản yêu cầu hoặc thiếu nhà → không đọc được gì', async () => {
    expect(await visibleProfiles(expired)).toEqual([]);
    expect(await visibleItems(expired)).toEqual([]);
    expect(await asExportRole(expired, null, 'SELECT 1 FROM removed_member_windows')).toEqual([]);
    expect(await visibleProfiles(null)).toEqual([]);
    expect(await visibleProfiles(removed, null)).toEqual([]);
  });

  it('mọi bảng trong ZIP chỉ có dòng của hồ sơ trong cửa sổ', async () => {
    for (const { table, column } of DATA_EXPORT_WINDOW_TABLES) {
      const rows = await asExportRole(
        removed,
        family,
        `SELECT count(*)::int AS n FROM ${table} WHERE ${column} <> '${removedProfile}'`,
      );
      expect({ table, rows }).toEqual({ table, rows: [{ n: 0 }] });
    }
  });

  it('role chỉ đọc: không ghi được dữ liệu, cửa sổ hay yêu cầu tải về', async () => {
    for (const statement of [
      `UPDATE health_profiles SET display_name = 'x'`,
      `DELETE FROM removed_member_windows`,
      `UPDATE data_exports SET status = 'failed'`,
      `SELECT 1 FROM accounts`,
    ])
      await expect(asExportRole(removed, family, statement)).rejects.toMatchObject({ code: '42501' });
  });
});
