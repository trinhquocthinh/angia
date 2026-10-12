import { and, eq } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { medicationCourses } from '@src/shared/db/schema/index.js';
import { findMedicationCourse } from './findMedicationCourse.js';
export async function stopStoredMedicationCourse(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  courseId: string,
  endDate: string,
) {
  const rows = await tx
    .update(medicationCourses)
    .set({ status: 'stopped', endDate })
    .where(
      and(
        eq(medicationCourses.familyId, familyId),
        eq(medicationCourses.healthProfileId, profileId),
        eq(medicationCourses.id, courseId),
        eq(medicationCourses.status, 'active'),
      ),
    )
    .returning({ id: medicationCourses.id });
  return rows.length ? findMedicationCourse(tx, familyId, profileId, courseId) : null;
}
