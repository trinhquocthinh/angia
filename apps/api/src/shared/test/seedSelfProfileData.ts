import { randomUUID } from 'node:crypto';
import type { HealthProfile } from '@angia/contracts';
import { confirmConsentByAttestation } from './confirmConsentByAttestation.js';
import { manualCourse } from './healthDataFixtures.js';
import type { SeededSession } from './seedAuthFixtures.js';
import type { ProfileTestApp } from './startProfileTestApp.js';

export const SELF_REMINDER_DATE = '2026-10-23';
export const SELF_SERIES_QUERY = 'kind=blood_pressure&from=2026-10-01&to=2026-10-31';

async function createConfirmedProfile(
  t: ProfileTestApp,
  main: SeededSession,
  displayName: string,
  birthYear = 1950,
) {
  const created = await t.call(main, 'POST', '/api/health-profiles', { birthYear, displayName });
  const profile = (await created.json()) as HealthProfile;
  await confirmConsentByAttestation(t, main, profile.id);
  return profile;
}

// Một hồ sơ có dữ liệu ở mọi route tự xem; mỗi nguồn mang dấu riêng để so nội dung phản hồi.
export async function seedSelfProfileData(
  t: ProfileTestApp,
  main: SeededSession,
  familyId: string,
  name: string,
  birthYear?: number,
) {
  const profile = await createConfirmedProfile(t, main, name, birthYear);
  const [prescriptionId, measurementId, reminderId] = [randomUUID(), randomUUID(), randomUUID()];
  const marker = {
    course: `Thuốc-${name}`,
    reminder: reminderId,
    facility: `Phòng khám-${name}`,
    measurement: measurementId,
    lab: `Chỉ số-${name}`,
  };
  await t.call(main, 'POST', `/api/health-profiles/${profile.id}/medication-courses`, {
    ...manualCourse,
    name: marker.course,
    startDate: '2026-01-01',
  });
  await t.owner.query(
    `INSERT INTO reminders(id,family_id,health_profile_id,date,slot,scheduled_at,medications)
     VALUES ($1,$2,$3,$4,'morning','2026-10-23T00:00:00.000Z',$5::jsonb)`,
    [
      reminderId,
      familyId,
      profile.id,
      SELF_REMINDER_DATE,
      JSON.stringify([{ courseId: randomUUID(), name: `Nhắc-${name}`, doseUnit: 'viên' }]),
    ],
  );
  await t.owner.query(
    `INSERT INTO prescriptions(id,family_id,health_profile_id,issued_date,facility,revisit_date,manual_without_source)
     VALUES ($1,$2,$3,'2026-10-01',$4,'2036-01-01',true)`,
    [prescriptionId, familyId, profile.id, marker.facility],
  );
  await t.owner.query(
    `INSERT INTO measurements(id,family_id,health_profile_id,kind,measured_on,systolic,diastolic,manual_without_source)
     VALUES ($1,$2,$3,'blood_pressure','2026-10-02',120,80,true)`,
    [measurementId, familyId, profile.id],
  );
  await t.owner.query(
    `INSERT INTO lab_results(id,family_id,health_profile_id,result_date,test_name,test_name_normalized,value,unit,manual_without_source)
     VALUES ($1,$2,$3,'2026-10-03',$4,$4,'5','mmol/L',true)`,
    [randomUUID(), familyId, profile.id, marker.lab],
  );
  return { profile, marker, foreign: Object.values(marker) };
}

export async function linkAccount(t: ProfileTestApp, accountId: string, profileId: string) {
  await t.owner.query('UPDATE accounts SET health_profile_id = $1 WHERE id = $2', [profileId, accountId]);
}
