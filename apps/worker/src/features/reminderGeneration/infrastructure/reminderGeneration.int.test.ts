import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPrivacyPgFixture } from '@src/shared/test/createPrivacyPgFixture.js';
import { generateReminders } from '../application/generateReminders.js';
import { createReminderRepository } from './createReminderRepository.js';

const DATE = '2026-10-23';

async function seedFamily(owner: pg.Client) {
  const [familyId, profileId, motherId, fatherId] = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
  await owner.query(`INSERT INTO families(id,name) VALUES ($1,'Nhà')`, [familyId]);
  for (const accountId of [motherId, fatherId])
    await owner.query(
      `INSERT INTO accounts(id,oidc_subject,display_name,family_id,family_role) VALUES ($1,$2,'Main',$3,'main')`,
      [accountId, `sub-${accountId}`, familyId],
    );
  await owner.query(
    `INSERT INTO health_profiles(id,family_id,display_name,consent_status,consent_source,consent_confirmed_at,
       consent_basis,consent_respondent_name) VALUES ($1,$2,'Bé An','confirmed','invitation',now(),'guardian','Mẹ')`,
    [profileId, familyId],
  );
  await owner.query(
    `INSERT INTO dose_slots(health_profile_id,family_id,slot,time_of_day) VALUES ($1,$2,'morning','07:00'),($1,$2,'evening','19:00')`,
    [profileId, familyId],
  );
  await owner.query(
    `INSERT INTO reminder_recipients(health_profile_id,family_id,account_id) VALUES ($1,$2,$3),($1,$2,$4)`,
    [profileId, familyId, motherId, fatherId],
  );
  const addCourse = (name: string, slots: string[], endDate: string | null = null) =>
    owner.query(
      `INSERT INTO medication_courses(id,family_id,health_profile_id,source,name,name_normalized,quantity_per_dose,
         dose_unit,slots,start_date,end_date,status) VALUES ($1,$2,$3,'self_reported',$4,lower($4),1,'viên',$5,'2026-10-01',$6,$7)`,
      [
        randomUUID(),
        familyId,
        profileId,
        name,
        slots,
        endDate,
        endDate && endDate < DATE ? 'ended' : 'active',
      ],
    );
  return { familyId, profileId, motherId, fatherId, addCourse };
}

describe('Sinh lời nhắc trên PostgreSQL thật, role app NOBYPASSRLS (SPEC-027)', () => {
  let fx: Awaited<ReturnType<typeof createPrivacyPgFixture>>;
  beforeAll(async () => {
    fx = await createPrivacyPgFixture();
  });
  afterAll(async () => {
    await fx?.close();
  });
  const rowsOf = async (profileId: string) =>
    (
      await fx.owner.query<{ slot: string; scheduled_at: Date; medications: { name: string }[] }>(
        'SELECT slot, scheduled_at, medications FROM reminders WHERE health_profile_id=$1 ORDER BY scheduled_at',
        [profileId],
      )
    ).rows;

  it('TC-071/072/073/074: gộp theo buổi, bỏ đợt đã kết thúc, chạy lại không đổi số dòng, tách gia đình', async () => {
    const a = await seedFamily(fx.owner);
    const b = await seedFamily(fx.owner);
    await a.addCourse('Metformin', ['morning']);
    await a.addCourse('Amlodipin', ['morning', 'evening']);
    await a.addCourse('Aspirin', ['morning']);
    await a.addCourse('Kháng sinh', ['morning'], '2026-10-22');
    await b.addCourse('Vitamin', ['noon']);
    const repository = createReminderRepository(fx.pool, randomUUID);

    const accounts = await repository.withFamily(a.familyId, (store) => store.listFamilyAccounts());
    expect(accounts.map((x) => x.id).sort()).toEqual([a.motherId, a.fatherId].sort());
    const profiles = await repository.withFamily(a.familyId, (store) => store.listProfiles(DATE));
    expect(profiles.map((p) => p.profileId)).toEqual([a.profileId]);
    expect(profiles[0]?.assignedAccountIds.sort()).toEqual([a.motherId, a.fatherId].sort());

    await generateReminders(repository, DATE);
    const before = await rowsOf(a.profileId);
    expect(before.map((r) => r.slot)).toEqual(['morning', 'evening']);
    expect(before[0]?.scheduled_at.toISOString()).toBe('2026-10-23T00:00:00.000Z');
    expect(before[0]?.medications.map((m) => m.name)).toEqual(['Amlodipin', 'Aspirin', 'Metformin']);

    const rerun = await generateReminders(repository, DATE);
    expect(await rowsOf(a.profileId)).toHaveLength(2);
    expect(rerun.families.find((f) => f.familyId === a.familyId)).toMatchObject({ created: 0, existing: 2 });
    // Gia đình B chỉ có thuốc buổi trưa chưa cấu hình giờ → không sinh nhắc, chỉ cảnh báo.
    expect(await rowsOf(b.profileId)).toHaveLength(0);
    expect(rerun.families.find((f) => f.familyId === b.familyId)?.unscheduledSlots).toEqual([
      { profileId: b.profileId, slot: 'noon' },
    ]);
  });

  it('TC-381: hồ sơ withdrawn không sinh lời nhắc dù còn đợt thuốc đang dùng', async () => {
    const a = await seedFamily(fx.owner);
    await a.addCourse('Metformin', ['morning']);
    await fx.owner.query(
      `UPDATE health_profiles SET consent_status='withdrawn', consent_withdrawn_at=now() WHERE id=$1`,
      [a.profileId],
    );
    const repository = createReminderRepository(fx.pool, randomUUID);
    const profiles = await repository.withFamily(a.familyId, (store) => store.listProfiles(DATE));
    expect(profiles).toMatchObject([{ profileId: a.profileId, consentConfirmed: false }]);
    await generateReminders(repository, DATE);
    expect(await rowsOf(a.profileId)).toHaveLength(0);
  });

  it('NFR-4: ngoài withFamilyScope role app không đọc được lời nhắc; xóa hồ sơ xóa luôn lời nhắc', async () => {
    const a = await seedFamily(fx.owner);
    await a.addCourse('Metformin', ['morning']);
    await generateReminders(createReminderRepository(fx.pool, randomUUID), DATE);
    const unscoped = await fx.pool.query('SELECT 1 FROM reminders WHERE health_profile_id=$1', [a.profileId]);
    expect(unscoped.rowCount).toBe(0);
    await fx.owner.query('DELETE FROM health_profiles WHERE id=$1', [a.profileId]);
    expect(await rowsOf(a.profileId)).toHaveLength(0);
  });
});
