import { and, eq } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { healthProfiles } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { MedicationManagementRepository } from '../application/managementPorts.js';
import { findMedicationCourse } from './findMedicationCourse.js';
import { stopStoredMedicationCourse } from './stopStoredMedicationCourse.js';
import { findMedicationCourses } from './findMedicationCourses.js';
import { findMedicationHistory } from './findMedicationHistory.js';
import { insertMedicationCourses } from './insertMedicationCourses.js';
import { lockMedicationProfile } from './lockMedicationProfile.js';
import { replaceMedicationCourses } from './replaceMedicationCourses.js';

export function createMedicationRepository(db: Database): MedicationManagementRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(db, familyId, (tx) =>
        work({
          findProfile: async (id) =>
            (
              await tx
                .select({ consentStatus: healthProfiles.consentStatus })
                .from(healthProfiles)
                .where(and(eq(healthProfiles.id, id), eq(healthProfiles.familyId, familyId)))
                .for('share')
            )[0] ?? null,
          lockMedicationProfile: (id) => lockMedicationProfile(tx, familyId, id),
          findMedicationCourse: (id, courseId) => findMedicationCourse(tx, familyId, id, courseId),
          stopMedicationCourse: (id, courseId, endDate) =>
            stopStoredMedicationCourse(tx, familyId, id, courseId, endDate),
          findMedicationCourses: (id) => findMedicationCourses(tx, familyId, id),
          findMedicationHistory: (id) => findMedicationHistory(tx, familyId, id),
          replaceMedicationCourses: (id, ids, endDate) =>
            replaceMedicationCourses(tx, familyId, id, ids, endDate),
          insertMedicationCourses: (inputs) => insertMedicationCourses(tx, familyId, inputs),
        }),
      ),
  };
}
