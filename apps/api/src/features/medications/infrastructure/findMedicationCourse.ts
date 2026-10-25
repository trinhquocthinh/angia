import { and, eq } from 'drizzle-orm';
import { fromNumeric } from '@src/shared/db/numericColumn.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { medicationCourses, prescriptionItems } from '@src/shared/db/schema/index.js';
import type { MedicationCourse } from '../domain/MedicationCourse.js';
import type { DoseSlot } from '@src/features/prescriptions/domain/Prescription.js';
export async function findMedicationCourse(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  courseId: string,
): Promise<MedicationCourse | null> {
  const [row] = await tx
    .select({ course: medicationCourses, strength: prescriptionItems.strength })
    .from(medicationCourses)
    .leftJoin(
      prescriptionItems,
      and(
        eq(prescriptionItems.id, medicationCourses.prescriptionItemId),
        eq(prescriptionItems.familyId, familyId),
      ),
    )
    .where(
      and(
        eq(medicationCourses.familyId, familyId),
        eq(medicationCourses.healthProfileId, profileId),
        eq(medicationCourses.id, courseId),
      ),
    )
    .for('update', { of: medicationCourses });
  if (!row) return null;
  return {
    ...row.course,
    strength: row.course.strength ?? row.strength,
    quantityPerDose: fromNumeric(row.course.quantityPerDose),
    slots: row.course.slots as DoseSlot[],
  } as MedicationCourse;
}
