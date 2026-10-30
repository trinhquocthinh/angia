import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from '../runMigrations.js';

describe('Ràng buộc nhắc tái khám và ledger (TC-478)', () => {
  let db: TestDatabase;
  let owner: pg.Client;
  const familyId = randomUUID();
  const otherFamilyId = randomUUID();
  const profileId = randomUUID();
  const deviceId = randomUUID();
  const reminderId = randomUUID();
  beforeAll(async () => {
    db = await startTestDatabase();
    await runMigrations(db.ownerUrl);
    owner = new pg.Client({ connectionString: db.ownerUrl });
    await owner.connect();
    await owner.query("INSERT INTO families(id,name) VALUES($1,'Nhà A'),($2,'Nhà B')", [
      familyId,
      otherFamilyId,
    ]);
    await owner.query("INSERT INTO health_profiles(id,family_id,display_name) VALUES($1,$2,'Mẹ')", [
      profileId,
      familyId,
    ]);
    const accountId = randomUUID();
    await owner.query(
      "INSERT INTO accounts(id,oidc_subject,display_name,family_id,family_role) VALUES($1::uuid,$1::text,'Người chăm',$2,'main')",
      [accountId, familyId],
    );
    await owner.query(
      "INSERT INTO push_subscriptions(id,family_id,account_id,authorized_at,endpoint,endpoint_hash,p256dh,auth) VALUES($1,$2,$3,now(),'https://push.example/revisit','hash','p','a')",
      [deviceId, familyId, accountId],
    );
    await owner.query(
      "INSERT INTO reminders(id,family_id,health_profile_id,date,slot,scheduled_at,medications) VALUES($1,$2,$3,'2026-10-31','morning',now(),'[{}]')",
      [reminderId, familyId, profileId],
    );
  });
  afterAll(async () => {
    await owner?.end();
    await db?.container.stop();
  });

  const insertRevisit = (
    offset = 'same_day',
    sendDate = '2026-10-31',
    family = familyId,
    date = '2026-10-31',
  ) => {
    const id = randomUUID();
    return owner.query(
      `INSERT INTO revisit_reminders(id,family_id,health_profile_id,revisit_date,offset_kind,send_date,scheduled_at)
       VALUES($1,$2,$3,$4,$5,$6,'2026-10-31T06:00:00+07:00') RETURNING id`,
      [id, family, profileId, date, offset, sendDate],
    );
  };
  const insertDelivery = (medicine: string | null, revisit: string | null, family = familyId) =>
    owner.query(
      `INSERT INTO reminder_deliveries(id,family_id,reminder_id,revisit_reminder_id,push_subscription_id,status)
     VALUES($1,$2,$3,$4,$5,'pending') RETURNING id`,
      [randomUUID(), family, medicine, revisit, deviceId],
    );

  it('TC-472: CHECK DB chặn ngày trước ngày kê và quá 3650 ngày, cho phép hai biên/null', async () => {
    for (const date of ['2026-09-30', '2036-09-29']) {
      await expect(
        owner.query(
          "INSERT INTO prescriptions(id,family_id,health_profile_id,issued_date,revisit_date,manual_without_source) VALUES($1,$2,$3,'2026-10-01',$4,true)",
          [randomUUID(), familyId, profileId, date],
        ),
      ).rejects.toMatchObject({ code: '23514' });
    }
    for (const date of ['2026-10-01', '2036-09-28', null]) {
      await expect(
        owner.query(
          "INSERT INTO prescriptions(id,family_id,health_profile_id,issued_date,revisit_date,manual_without_source) VALUES($1,$2,$3,'2026-10-01',$4,true)",
          [randomUUID(), familyId, profileId, date],
        ),
      ).resolves.toBeDefined();
    }
  });

  it('TC-478: kiểm mốc/ngày gửi, FK ghép và chống trùng hồ sơ/ngày/mốc', async () => {
    await expect(insertRevisit('invalid')).rejects.toMatchObject({ code: '23514' });
    await expect(insertRevisit('two_days_before', '2026-10-30')).rejects.toMatchObject({ code: '23514' });
    await expect(insertRevisit('same_day', '2026-10-30')).rejects.toMatchObject({ code: '23514' });
    await expect(insertRevisit('same_day', '2026-10-31', otherFamilyId)).rejects.toMatchObject({
      code: '23503',
    });
    await insertRevisit('two_days_before', '2026-10-29');
    await expect(insertRevisit('two_days_before', '2026-10-29')).rejects.toMatchObject({ code: '23505' });
  });

  it('TC-478: ledger chỉ nhận đúng một loại nhắc, chặn trùng thiết bị và khác gia đình', async () => {
    const revisitId = (await insertRevisit()).rows[0].id as string;
    await expect(insertDelivery(null, null)).rejects.toMatchObject({ code: '23514' });
    await expect(insertDelivery(reminderId, revisitId)).rejects.toMatchObject({ code: '23514' });
    await expect(insertDelivery(null, revisitId, otherFamilyId)).rejects.toMatchObject({ code: '23503' });
    await insertDelivery(reminderId, null);
    await insertDelivery(null, revisitId);
    await expect(insertDelivery(null, revisitId)).rejects.toMatchObject({ code: '23505' });
    await owner.query('DELETE FROM revisit_reminders WHERE id = $1', [revisitId]);
    expect(
      (await owner.query('SELECT 1 FROM reminder_deliveries WHERE revisit_reminder_id = $1', [revisitId]))
        .rowCount,
    ).toBe(0);
    expect(
      (await owner.query('SELECT 1 FROM reminder_deliveries WHERE reminder_id = $1', [reminderId])).rowCount,
    ).toBe(1);
  });

  it('TC-478: role app NOBYPASSRLS chỉ đọc/ghi nhắc tái khám trong gia đình hiện hành', async () => {
    const app = new pg.Client({ connectionString: db.appUrl });
    await app.connect();
    try {
      await app.query('BEGIN');
      await app.query("SELECT set_config('app.family_id', $1, true)", [otherFamilyId]);
      expect((await app.query('SELECT * FROM revisit_reminders')).rowCount).toBe(0);
      await app.query("SELECT set_config('app.family_id', $1, true)", [familyId]);
      expect((await app.query('SELECT * FROM revisit_reminders')).rowCount).toBeGreaterThan(0);
      await app.query('ROLLBACK');
      await expect(
        app.query(
          "INSERT INTO revisit_reminders(id,family_id,health_profile_id,revisit_date,offset_kind,send_date,scheduled_at) VALUES($1,$2,$3,'2026-11-01','same_day','2026-11-01',now())",
          [randomUUID(), familyId, profileId],
        ),
      ).rejects.toMatchObject({ code: '42501' });
    } finally {
      await app.end();
    }
  });

  it('TC-478: xóa hồ sơ xóa nhắc và ledger kèm theo', async () => {
    const revisitId = (await insertRevisit('same_day', '2026-11-02', familyId, '2026-11-02')).rows[0]
      .id as string;
    await insertDelivery(null, revisitId);
    await owner.query('DELETE FROM health_profiles WHERE id = $1', [profileId]);
    expect(
      (await owner.query('SELECT 1 FROM revisit_reminders WHERE health_profile_id = $1', [profileId]))
        .rowCount,
    ).toBe(0);
    expect(
      (await owner.query('SELECT 1 FROM reminder_deliveries WHERE revisit_reminder_id = $1', [revisitId]))
        .rowCount,
    ).toBe(0);
  });
});
