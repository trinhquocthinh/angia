import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import { seedFamilyOnlyRows, seedProfileRows } from './seedSelfScopeRows.js';

// Mỗi bảng self_read_only có dòng hợp lệ; không vô hiệu hóa FK/CHECK hoặc RLS để kiểm ghi.
export async function seedSelfReadOnlyRows(owner: pg.Client, familyId: string, profileId: string) {
  await seedFamilyOnlyRows(owner, familyId, profileId);
  await seedProfileRows(owner, familyId, profileId);
  await owner.query('UPDATE family_scan_quotas SET held_scans=1 WHERE family_id=$1', [familyId]);
  const { rows } = await owner.query<{ id: string }>('SELECT id FROM accounts WHERE family_id=$1 LIMIT 1', [
    familyId,
  ]);
  const accountId = rows[0]!.id;
  const courseId = randomUUID();
  const statements: Array<[string, unknown[]]> = [
    [
      `INSERT INTO adherence_periods(id,family_id,health_profile_id,medication_name,medication_name_normalized,status,from_date,recorded_by)
      VALUES($1,$2,$3,'Canxi','canxi','taking','2026-10-01',$4)`,
      [randomUUID(), familyId, profileId, accountId],
    ],
    [
      `INSERT INTO consent_legacy_attestations(profile_id,family_id,confirmed_at,basis) VALUES($1,$2,now(),'self')`,
      [profileId, familyId],
    ],
    [
      `INSERT INTO dose_confirmations(id,family_id,health_profile_id,date,slot,confirmed_by_name,confirmed_at)
      VALUES($1,$2,$3,'2026-10-01','morning','Mẹ',now())`,
      [randomUUID(), familyId, profileId],
    ],
    [
      `INSERT INTO dose_slots(health_profile_id,family_id,slot,time_of_day) VALUES($1,$2,'morning','07:00')`,
      [profileId, familyId],
    ],
    [
      `INSERT INTO lab_results(id,family_id,health_profile_id,result_date,test_name,test_name_normalized,value,manual_without_source)
      VALUES($1,$2,$3,'2026-10-01','Chỉ số','chỉ số','5',true)`,
      [randomUUID(), familyId, profileId],
    ],
    [
      `INSERT INTO medication_courses(id,family_id,health_profile_id,source,name,name_normalized,quantity_per_dose,slots,start_date,status)
      VALUES($1,$2,$3,'self_reported','Canxi','canxi',1,ARRAY['morning'],'2026-10-01','active')`,
      [courseId, familyId, profileId],
    ],
    [
      `INSERT INTO as_needed_doses(id,family_id,health_profile_id,medication_course_id,given_at)
      VALUES($1,$2,$3,$4,now())`,
      [randomUUID(), familyId, profileId, courseId],
    ],
    [
      `INSERT INTO reminder_recipients(health_profile_id,family_id,account_id) VALUES($1,$2,$3)`,
      [profileId, familyId, accountId],
    ],
    [
      `INSERT INTO revisit_reminders(id,family_id,health_profile_id,revisit_date,offset_kind,send_date,scheduled_at)
      VALUES($1,$2,$3,'2026-10-01','same_day','2026-10-01',now())`,
      [randomUUID(), familyId, profileId],
    ],
    [
      `INSERT INTO temperature_readings(id,family_id,health_profile_id,celsius,measured_at) VALUES($1,$2,$3,37.0,now())`,
      [randomUUID(), familyId, profileId],
    ],
  ];
  for (const [query, values] of statements) await owner.query(query, values);
}
