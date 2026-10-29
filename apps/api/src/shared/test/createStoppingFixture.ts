import { randomUUID } from 'node:crypto';
import type { HealthProfile, MedicationCourse } from '@angia/contracts';
import { expect } from 'vitest';
import { acceptConsentInvitation } from './acceptConsentInvitation.js';
import type { ProfileTestApp } from './startProfileTestApp.js';
import { createFiniteCourse } from './createFiniteCourse.js';
export async function createStoppingFixture(t: ProfileTestApp, consent = true, finite = false) {
  const familyId = await t.family();
  const main = await t.session(familyId);
  const profile = (await (
    await t.call(main, 'POST', '/api/health-profiles', { birthYear: 1950, displayName: 'Bà ngoại' })
  ).json()) as HealthProfile;
  if (consent) await acceptConsentInvitation(t, main, profile.id);
  const collection = `/api/health-profiles/${profile.id}/medication-courses`;
  let course: MedicationCourse;
  if (finite) {
    course = await createFiniteCourse(t, main, profile.id, collection);
  } else {
    // Hồ sơ chưa đồng thuận: seed bằng owner để kiểm quyền trên đợt đã có.
    const response = consent
      ? await t.call(main, 'POST', collection, {
          name: 'Canxi',
          strength: '500mg',
          quantityPerDose: 0.5,
          doseUnit: 'viên',
          slots: ['morning'],
          startDate: '2026-10-01',
        })
      : null;
    if (response) {
      expect(response.status).toBe(201);
      course = (await response.json()) as MedicationCourse;
    } else {
      const id = randomUUID();
      await t.owner.query(
        `INSERT INTO medication_courses (id, family_id, health_profile_id, source, name, name_normalized, strength, quantity_per_dose, dose_unit, slots, start_date, status) VALUES ($1,$2,$3,'self_reported','Canxi','canxi','500mg',0.5,'viên',ARRAY['morning'],'2026-10-01','active') RETURNING id`,
        [id, familyId, profile.id],
      );
      course = {
        id,
        healthProfileId: profile.id,
        prescriptionItemId: null,
        source: 'self_reported',
        name: 'Canxi',
        strength: '500mg',
        quantityPerDose: 0.5,
        doseUnit: 'viên',
        slots: ['morning'],
        startDate: '2026-10-01',
        endDate: null,
        status: 'active',
      };
    }
  }
  const stopPath = `${collection}/${course.id}/stop`;
  const stop = (stopDate = '2026-10-05') => t.call(main, 'POST', stopPath, { stopDate });
  const rows = async () =>
    (
      await t.owner.query(
        'SELECT id, status, end_date::text FROM medication_courses WHERE health_profile_id=$1 ORDER BY id',
        [profile.id],
      )
    ).rows;
  return { familyId, main, profile, collection, course, stopPath, stop, rows };
}
