import { and, eq } from 'drizzle-orm';
import { findProfileInFamily } from '@src/features/profiles/infrastructure/findProfileInFamily.js';
import type { Database } from '@src/shared/db/createDatabase.js';
import { asNeededDoses, medicationCourses } from '@src/shared/db/schema/index.js';
import { type FamilyScope, withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { AsNeededDoseRepository } from '../application/ports.js';
import { findAsNeededCourse } from './findAsNeededCourse.js';
import { insertAsNeededDose } from './insertAsNeededDose.js';
import { listStoredAsNeededDoses } from './listStoredAsNeededDoses.js';

// RLS qua withFamilyScope; điều kiện family_id/hồ sơ bổ sung phòng thủ theo chiều sâu.
export function createAsNeededDoseRepository(
  db: Database,
  scope: FamilyScope = withFamilyScope,
): AsNeededDoseRepository {
  return {
    withFamily: (familyId, work) =>
      scope(db, familyId, (tx) => {
        const ofProfile = <T extends typeof asNeededDoses | typeof medicationCourses>(
          table: T,
          profileId: string,
          id: string,
        ) => and(eq(table.id, id), eq(table.familyId, familyId), eq(table.healthProfileId, profileId));
        return work({
          findProfile: (id) => findProfileInFamily(tx, familyId, id, 'share'),
          findCourse: (profileId, courseId) => findAsNeededCourse(tx, familyId, profileId, courseId),
          insertDose: (input) => insertAsNeededDose(tx, familyId, input),
          deleteDose: async (profileId, doseId) =>
            (
              await tx
                .delete(asNeededDoses)
                .where(ofProfile(asNeededDoses, profileId, doseId))
                .returning({ id: asNeededDoses.id })
            ).length > 0,
          listDoses: (profileId, range) => listStoredAsNeededDoses(tx, familyId, profileId, range),
          setUserInterval: async (profileId, courseId, text) => {
            await tx
              .update(medicationCourses)
              .set({ userIntervalText: text })
              .where(ofProfile(medicationCourses, profileId, courseId));
          },
        });
      }),
  };
}
